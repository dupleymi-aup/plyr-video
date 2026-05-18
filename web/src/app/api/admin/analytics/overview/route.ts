import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-errors";
import { NextResponse } from "next/server";
import type {
  WatchTimeSummary,
  CompletionSummary,
  DailyWatchStats,
  TopVideoStats,
  TopStudentStats,
  RoleActivity,
} from "@/types/analytics";

export async function GET(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateWhere = startDate || endDate
      ? prisma.sql`WHERE vv.createdAt >= ${startDate ? new Date(startDate) : new Date("2000-01-01")} AND vv.createdAt <= ${endDate ? new Date(endDate) : new Date("2100-12-31")}`
      : prisma.sql``;

    const dateWhereInner = startDate || endDate
      ? prisma.sql`AND vv.createdAt >= ${startDate ? new Date(startDate) : new Date("2000-01-01")} AND vv.createdAt <= ${endDate ? new Date(endDate) : new Date("2100-12-31")}`
      : prisma.sql``;

    const dailyWhere = startDate || endDate
      ? prisma.sql`WHERE vv.createdAt >= ${startDate ? new Date(startDate) : new Date("2000-01-01")} AND vv.createdAt <= ${endDate ? new Date(endDate) : new Date("2100-12-31")}`
      : prisma.sql`WHERE vv.createdAt >= datetime('now', '-30 days')`;

    // Total watch time and views
    const watchTimeResult = await prisma.$queryRaw`
      SELECT
        COALESCE(SUM(vv.watchedSeconds), 0) as totalSeconds,
        COUNT(DISTINCT vv.userId) as uniqueViewers,
        COUNT(*) as totalViews
      FROM VideoView vv
      ${dateWhere}
    `;

    // Average completion rate
    const completionResult = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total,
        AVG(CASE WHEN v.duration > 0 THEN CAST(vv.watchedSeconds AS FLOAT) / v.duration ELSE 0 END) as avgCompletion
      FROM VideoView vv
      INNER JOIN Video v ON vv.videoId = v.id
      WHERE v.duration IS NOT NULL AND v.duration > 0
      ${dateWhereInner}
    `;

    // Daily watch time series
    const dailyResult = await prisma.$queryRaw`
      SELECT
        date(vv.createdAt) as date,
        SUM(vv.watchedSeconds) as totalSeconds,
        COUNT(DISTINCT vv.userId) as uniqueViewers,
        COUNT(*) as totalViews
      FROM VideoView vv
      ${dailyWhere}
      GROUP BY date(vv.createdAt)
      ORDER BY date(vv.createdAt) ASC
    `;

    // Top videos by watch time
    const topVideosResult = await prisma.$queryRaw`
      SELECT
        v.id,
        v.title,
        SUM(vv.watchedSeconds) as totalSeconds,
        COUNT(*) as views,
        AVG(CASE WHEN v.duration > 0 THEN CAST(vv.watchedSeconds AS FLOAT) / v.duration ELSE 0 END) as avgCompletion
      FROM VideoView vv
      INNER JOIN Video v ON vv.videoId = v.id
      ${dateWhere}
      GROUP BY v.id, v.title
      ORDER BY totalSeconds DESC
      LIMIT 10
    `;

    // Top students by watch time
    const topStudentsResult = await prisma.$queryRaw`
      SELECT
        u.id,
        u.name,
        u.email,
        SUM(vv.watchedSeconds) as totalSeconds,
        COUNT(DISTINCT vv.videoId) as videosWatched,
        COUNT(*) as totalViews
      FROM VideoView vv
      INNER JOIN User u ON vv.userId = u.id
      WHERE u.role = 'STUDENT'
      ${dateWhereInner}
      GROUP BY u.id, u.name, u.email
      ORDER BY totalSeconds DESC
      LIMIT 10
    `;

    // Activity by role
    const activityByRole = await prisma.$queryRaw`
      SELECT
        u.role,
        COUNT(*) as viewCount,
        SUM(vv.watchedSeconds) as totalSeconds
      FROM VideoView vv
      INNER JOIN User u ON vv.userId = u.id
      ${dateWhere}
      GROUP BY u.role
    `;

    const watchTime = (watchTimeResult as WatchTimeSummary[])[0];
    const completion = (completionResult as CompletionSummary[])[0];
    const daily = dailyResult as DailyWatchStats[];

    return NextResponse.json({
      totalWatchSeconds: Number(watchTime?.totalSeconds ?? 0),
      uniqueViewers: Number(watchTime?.uniqueViewers ?? 0),
      totalViews: Number(watchTime?.totalViews ?? 0),
      avgCompletionRate: Number(completion?.avgCompletion ?? 0) * 100,
      dailyWatchTime: daily.map((d) => ({
        date: d.date,
        totalSeconds: Number(d.totalSeconds),
        uniqueViewers: Number(d.uniqueViewers),
        totalViews: Number(d.totalViews),
      })),
      topVideos: (topVideosResult as TopVideoStats[]).map((v) => ({
        id: v.id,
        title: v.title,
        totalSeconds: Number(v.totalSeconds),
        views: Number(v.views),
        avgCompletion: Number(v.avgCompletion) * 100,
      })),
      topStudents: (topStudentsResult as TopStudentStats[]).map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        totalSeconds: Number(s.totalSeconds),
        videosWatched: Number(s.videosWatched),
        totalViews: Number(s.totalViews),
      })),
      activityByRole: (activityByRole as RoleActivity[]).map((r) => ({
        role: r.role,
        viewCount: Number(r.viewCount),
        totalSeconds: Number(r.totalSeconds),
      })),
    });
  } catch (error) {
    return handleApiError(error, "analytics-overview");
  }
}
