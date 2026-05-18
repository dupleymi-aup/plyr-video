import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    const dateFilter = startDate || endDate
      ? prisma.sql`AND vv.createdAt >= ${startDate ? new Date(startDate) : new Date("2000-01-01")} AND vv.createdAt <= ${endDate ? new Date(endDate) : new Date("2100-12-31")}`
      : prisma.sql``;

    const videos = await prisma.$queryRaw`
      SELECT
        v.id,
        v.title,
        v.duration,
        v.viewCount,
        v.likeCount,
        v.commentCount,
        v.status,
        v.visibility,
        v.publishedAt,
        COUNT(DISTINCT vv.userId) as uniqueViewers,
        COUNT(vv.id) as totalViews,
        COALESCE(SUM(vv.watchedSeconds), 0) as totalSeconds,
        AVG(CASE WHEN v.duration > 0 THEN CAST(vv.watchedSeconds AS FLOAT) / v.duration ELSE 0 END) as avgCompletion
      FROM Video v
      LEFT JOIN VideoView vv ON v.id = vv.videoId
      WHERE v.status != 'DELETED' ${dateFilter}
      GROUP BY v.id, v.title, v.duration, v.viewCount, v.likeCount, v.commentCount, v.status, v.visibility, v.publishedAt
      ORDER BY totalSeconds DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as total
      FROM Video v
      WHERE v.status != 'DELETED'
    `;

    const total = Number((countResult as any[])[0]?.total ?? 0);

    return NextResponse.json({
      videos: (videos as any[]).map((v: any) => ({
        id: v.id,
        title: v.title,
        duration: v.duration,
        viewCount: Number(v.viewCount),
        likeCount: Number(v.likeCount),
        commentCount: Number(v.commentCount),
        status: v.status,
        visibility: v.visibility,
        publishedAt: v.publishedAt,
        uniqueViewers: Number(v.uniqueViewers),
        totalViews: Number(v.totalViews),
        totalSeconds: Number(v.totalSeconds),
        avgCompletion: Number(v.avgCompletion) * 100,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Analytics videos API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
