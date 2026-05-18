import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function escapeCsv(value: unknown): string {
  const str = String(value ?? "");
  return `"${str.replace(/"/g, '""')}"`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { type = "students", startDate, endDate } = body;

    const dateFilter = startDate || endDate
      ? prisma.sql`AND vv.createdAt >= ${startDate ? new Date(startDate) : new Date("2000-01-01")} AND vv.createdAt <= ${endDate ? new Date(endDate) : new Date("2100-12-31")}`
      : prisma.sql``;

    let headers: string[];
    let rows: string[][];

    if (type === "students") {
      const students = await prisma.$queryRaw`
        SELECT
          u.id,
          u.name,
          u.email,
          COALESCE(SUM(vv.watchedSeconds), 0) as totalSeconds,
          COUNT(DISTINCT vv.videoId) as videosWatched,
          COUNT(vv.id) as totalViews
        FROM User u
        LEFT JOIN VideoView vv ON u.id = vv.userId
        WHERE u.role = 'STUDENT' ${dateFilter}
        GROUP BY u.id, u.name, u.email
        ORDER BY totalSeconds DESC
      `;

      headers = ["ID", "Name", "Email", "Watch Time (min)", "Videos Watched", "Total Views"];
      rows = (students as any[]).map((s: any) => [
        s.id,
        s.name || "",
        s.email || "",
        (Number(s.totalSeconds) / 60).toFixed(1),
        Number(s.videosWatched),
        Number(s.totalViews),
      ]);
    } else if (type === "videos") {
      const videos = await prisma.$queryRaw`
        SELECT
          v.id,
          v.title,
          v.duration,
          COUNT(DISTINCT vv.userId) as uniqueViewers,
          COALESCE(SUM(vv.watchedSeconds), 0) as totalSeconds,
          AVG(CASE WHEN v.duration > 0 THEN CAST(vv.watchedSeconds AS FLOAT) / v.duration ELSE 0 END) as avgCompletion
        FROM Video v
        LEFT JOIN VideoView vv ON v.id = vv.videoId
        WHERE v.status != 'DELETED' ${dateFilter}
        GROUP BY v.id, v.title, v.duration
        ORDER BY totalSeconds DESC
      `;

      headers = ["ID", "Title", "Duration (s)", "Unique Viewers", "Watch Time (min)", "Avg Completion %"];
      rows = (videos as any[]).map((v: any) => [
        v.id,
        v.title || "",
        v.duration || "",
        Number(v.uniqueViewers),
        (Number(v.totalSeconds) / 60).toFixed(1),
        (Number(v.avgCompletion) * 100).toFixed(1),
      ]);
    } else {
      const stats = await prisma.$queryRaw`
        SELECT
          COALESCE(SUM(vv.watchedSeconds), 0) as totalSeconds,
          COUNT(DISTINCT vv.userId) as uniqueViewers,
          COUNT(*) as totalViews
        FROM VideoView vv
        WHERE 1=1 ${dateFilter}
      `;

      headers = ["Metric", "Value"];
      const statData = (stats as any[])[0];
      rows = [
        ["Total Watch Time (min)", (Number(statData?.totalSeconds ?? 0) / 60).toFixed(1)],
        ["Unique Viewers", String(Number(statData?.uniqueViewers ?? 0))],
        ["Total Views", String(Number(statData?.totalViews ?? 0))],
      ];
    }

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((r) => r.map(escapeCsv).join(",")),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="analytics-${type}-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Analytics export API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
