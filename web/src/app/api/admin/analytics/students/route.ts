import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-errors";
import { NextResponse } from "next/server";
import type { StudentAnalyticsItem, TotalCountResult } from "@/types/analytics";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // Escape LIKE special characters to prevent wildcard injection
    const escapeLike = (str: string) =>
      str.replace(/%/g, "\\%").replace(/_/g, "\\_");

    const searchFilter = search
      ? prisma.sql`AND (u.name LIKE ${`%${escapeLike(search)}%`} ESCAPE '\\' OR u.email LIKE ${`%${escapeLike(search)}%`} ESCAPE '\\')`
      : prisma.sql``;

    const dateFilter = startDate || endDate
      ? prisma.sql`AND vv.createdAt >= ${startDate ? new Date(startDate) : new Date("2000-01-01")} AND vv.createdAt <= ${endDate ? new Date(endDate) : new Date("2100-12-31")}`
      : prisma.sql``;

    const students = await prisma.$queryRaw`
      SELECT
        u.id,
        u.name,
        u.email,
        u.createdAt,
        COALESCE(SUM(vv.watchedSeconds), 0) as totalSeconds,
        COUNT(DISTINCT vv.videoId) as videosWatched,
        COUNT(vv.id) as totalViews,
        (SELECT COUNT(*) FROM Comment c WHERE c.userId = u.id) as commentCount,
        (SELECT COUNT(*) FROM LikedVideo lv WHERE lv.userId = u.id) as likeCount
      FROM User u
      LEFT JOIN VideoView vv ON u.id = vv.userId
      WHERE u.role = 'STUDENT' ${dateFilter} ${searchFilter}
      GROUP BY u.id, u.name, u.email, u.createdAt
      ORDER BY totalSeconds DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const countResult = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT u.id) as total
      FROM User u
      WHERE u.role = 'STUDENT' ${searchFilter}
    `;

    const total = Number((countResult as TotalCountResult[])[0]?.total ?? 0);

    return NextResponse.json({
      students: (students as StudentAnalyticsItem[]).map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        createdAt: s.createdAt,
        totalSeconds: Number(s.totalSeconds),
        videosWatched: Number(s.videosWatched),
        totalViews: Number(s.totalViews),
        commentCount: Number(s.commentCount),
        likeCount: Number(s.likeCount),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error, "analytics-students");
  }
}
