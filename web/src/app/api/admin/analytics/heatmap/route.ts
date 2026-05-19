import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-errors";
import { NextResponse } from "next/server";
import type { HeatmapDataPoint } from "@/types/analytics";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type") || "all";

    const dateFilter = startDate || endDate
      ? prisma.sql`WHERE vv.createdAt >= ${startDate ? new Date(startDate) : new Date("2000-01-01")} AND vv.createdAt <= ${endDate ? new Date(endDate) : new Date("2100-12-31")}`
      : prisma.sql``;

    let heatmapData: HeatmapDataPoint[] = [];

    if (type === "video_views" || type === "all") {
      // VideoView heatmap: SQLite strftime('%w') returns 0=Sunday, convert to 0=Monday
      const videoHeatmap = await prisma.$queryRaw<HeatmapDataPoint[]>`
        SELECT
          CASE CAST(strftime('%w', vv.createdAt) AS INTEGER)
            WHEN 0 THEN 6
            ELSE CAST(strftime('%w', vv.createdAt) AS INTEGER) - 1
          END as dayOfWeek,
          CAST(strftime('%H', vv.createdAt) AS INTEGER) as hour,
          COUNT(*) as activityCount,
          COALESCE(SUM(vv.watchedSeconds), 0) as watchSeconds
        FROM VideoView vv
        ${dateFilter}
        GROUP BY dayOfWeek, hour
        ORDER BY dayOfWeek, hour
      `;
      heatmapData = heatmapData.concat(videoHeatmap);
    }

    if (type === "submissions" || type === "all") {
      const subHeatmap = await prisma.$queryRaw<HeatmapDataPoint[]>`
        SELECT
          CASE CAST(strftime('%w', s.submittedAt) AS INTEGER)
            WHEN 0 THEN 6
            ELSE CAST(strftime('%w', s.submittedAt) AS INTEGER) - 1
          END as dayOfWeek,
          CAST(strftime('%H', s.submittedAt) AS INTEGER) as hour,
          COUNT(*) as activityCount,
          0 as watchSeconds
        FROM Submission s
        GROUP BY dayOfWeek, hour
      `;
      // Merge with existing data
      for (const point of subHeatmap) {
        const existing = heatmapData.find(
          (d) => d.dayOfWeek === Number(point.dayOfWeek) && d.hour === Number(point.hour)
        );
        if (existing) {
          (existing.activityCount as number) += Number(point.activityCount);
        } else {
          heatmapData.push(point);
        }
      }
    }

    if (type === "quiz_attempts" || type === "all") {
      const quizHeatmap = await prisma.$queryRaw<HeatmapDataPoint[]>`
        SELECT
          CASE CAST(strftime('%w', qa.completedAt) AS INTEGER)
            WHEN 0 THEN 6
            ELSE CAST(strftime('%w', qa.completedAt) AS INTEGER) - 1
          END as dayOfWeek,
          CAST(strftime('%H', qa.completedAt) AS INTEGER) as hour,
          COUNT(*) as activityCount,
          0 as watchSeconds
        FROM QuizAttempt qa
        GROUP BY dayOfWeek, hour
      `;
      for (const point of quizHeatmap) {
        const existing = heatmapData.find(
          (d) => d.dayOfWeek === Number(point.dayOfWeek) && d.hour === Number(point.hour)
        );
        if (existing) {
          (existing.activityCount as number) += Number(point.activityCount);
        } else {
          heatmapData.push(point);
        }
      }
    }

    // Find peak day and hour
    const peakDay = heatmapData.reduce((max, d) => Number(d.activityCount) > Number(max.activityCount) ? d : max, heatmapData[0] || { dayOfWeek: 0 });
    const peakHour = heatmapData.reduce((max, d) => Number(d.activityCount) > Number(max.activityCount) ? d : max, heatmapData[0] || { hour: 0 });
    const totalActivity = heatmapData.reduce((sum, d) => sum + Number(d.activityCount), 0);

    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    return NextResponse.json({
      heatmapData: heatmapData.map((d) => ({
        dayOfWeek: Number(d.dayOfWeek),
        hour: Number(d.hour),
        activityCount: Number(d.activityCount),
        watchSeconds: Number(d.watchSeconds),
      })),
      peakDay: dayNames[Number(peakDay.dayOfWeek)] || "N/A",
      peakHour: `${Number(peakHour.hour)}:00`,
      totalActivity,
    });
  } catch (error) {
    return handleApiError(error, "analytics-heatmap");
  }
}
