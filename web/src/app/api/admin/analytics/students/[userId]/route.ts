import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-errors";
import { NextResponse } from "next/server";
import type { WeeklyActivityDay, StudentSummary } from "@/types/analytics";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  try {
    const dateFilter = startDate || endDate
      ? {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        }
      : undefined;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Watch history
    const watchHistory = await prisma.videoView.findMany({
      where: {
        userId,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      include: {
        video: { select: { id: true, title: true, duration: true, thumbnailKey: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    // Weekly activity (last 12 weeks)
    const weeklyActivity = await prisma.$queryRaw`
      SELECT
        date(vv.createdAt) as date,
        SUM(vv.watchedSeconds) as totalSeconds,
        COUNT(DISTINCT vv.videoId) as videosWatched
      FROM VideoView vv
      WHERE vv.userId = ${userId} AND vv.createdAt >= datetime('now', '-84 days')
      GROUP BY date(vv.createdAt)
      ORDER BY date(vv.createdAt) ASC
    `;

    // Comments
    const comments = await prisma.comment.findMany({
      where: { userId },
      include: {
        video: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Likes
    const likes = await prisma.likedVideo.findMany({
      where: { userId },
      include: {
        video: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Summary
    const summary = await prisma.$queryRaw`
      SELECT
        SUM(watchedSeconds) as totalSeconds,
        COUNT(DISTINCT videoId) as videosWatched,
        COUNT(*) as totalViews,
        AVG(CASE WHEN v.duration > 0 THEN CAST(vv.watchedSeconds AS FLOAT) / v.duration ELSE 0 END) as avgCompletion
      FROM VideoView vv
      INNER JOIN Video v ON vv.videoId = v.id
      WHERE vv.userId = ${userId}
    `;

    const summaryData = (summary as StudentSummary[])[0];

    return NextResponse.json({
      user,
      watchHistory: watchHistory.map((w) => ({
        id: w.id,
        watchedSeconds: w.watchedSeconds,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        completionRate: w.video.duration
          ? (w.watchedSeconds / w.video.duration) * 100
          : 0,
        video: w.video,
      })),
      weeklyActivity: (weeklyActivity as WeeklyActivityDay[]).map((w) => ({
        date: w.date,
        totalSeconds: Number(w.totalSeconds),
        videosWatched: Number(w.videosWatched),
      })),
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        video: c.video,
      })),
      likes: likes.map((l) => ({
        id: l.id,
        createdAt: l.createdAt,
        video: l.video,
      })),
      summary: {
        totalSeconds: Number(summaryData?.totalSeconds ?? 0),
        videosWatched: Number(summaryData?.videosWatched ?? 0),
        totalViews: Number(summaryData?.totalViews ?? 0),
        avgCompletionRate: Number(summaryData?.avgCompletion ?? 0) * 100,
      },
    });
  } catch (error) {
    return handleApiError(error, "analytics-student-detail");
  }
}
