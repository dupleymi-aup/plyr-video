import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-errors";
import { NextResponse } from "next/server";
import type {
  ExportStudentStats,
  ExportVideoStats,
  ExportTotalStats,
  ExportPerformanceStats,
  ExportCohortStats,
  ExportAtRiskStats,
} from "@/types/analytics";

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
      rows = (students as ExportStudentStats[]).map((s) => [
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
      rows = (videos as ExportVideoStats[]).map((v) => [
        v.id,
        v.title || "",
        v.duration || "",
        Number(v.uniqueViewers),
        (Number(v.totalSeconds) / 60).toFixed(1),
        (Number(v.avgCompletion) * 100).toFixed(1),
      ]);
    } else if (type === "totals") {
      const stats = await prisma.$queryRaw`
        SELECT
          COALESCE(SUM(vv.watchedSeconds), 0) as totalSeconds,
          COUNT(DISTINCT vv.userId) as uniqueViewers,
          COUNT(*) as totalViews
        FROM VideoView vv
        WHERE 1=1 ${dateFilter}
      `;

      headers = ["Metric", "Value"];
      const statData = (stats as ExportTotalStats[])[0];
      rows = [
        ["Total Watch Time (min)", (Number(statData?.totalSeconds ?? 0) / 60).toFixed(1)],
        ["Unique Viewers", String(Number(statData?.uniqueViewers ?? 0))],
        ["Total Views", String(Number(statData?.totalViews ?? 0))],
      ];
    } else if (type === "performance") {
      const perf = await prisma.$queryRaw<ExportPerformanceStats[]>`
        SELECT
          u.name as studentName,
          u.email,
          c.title as courseTitle,
          COALESCE(AVG(g.value), 0) as grade,
          COUNT(DISTINCT s.id) as submissionCount,
          COUNT(DISTINCT qa.id) as quizAttempts,
          CASE WHEN COUNT(DISTINCT qa.id) > 0 THEN
            ROUND(CAST(SUM(CASE WHEN qa.passed = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(DISTINCT qa.id) * 100, 1)
          ELSE 0 END as quizPassRate
        FROM User u
        INNER JOIN CourseEnrollment ce ON ce.studentId = u.id
        INNER JOIN Course c ON c.id = ce.courseId
        LEFT JOIN Grade g ON g.enrollmentId = ce.id
        LEFT JOIN Assignment a ON a.courseId = c.id
        LEFT JOIN Submission s ON s.assignmentId = a.id AND s.studentId = u.id
        LEFT JOIN Quiz q ON q.courseId = c.id
        LEFT JOIN QuizAttempt qa ON qa.quizId = q.id AND qa.studentId = u.id
        WHERE u.role = 'STUDENT' AND c.status != 'DRAFT'
        GROUP BY u.id, u.email, u.name, c.id, c.title
        ORDER BY grade DESC
      `;

      headers = ["Student", "Email", "Course", "Grade %", "Submissions", "Quiz Attempts", "Quiz Pass Rate %"];
      rows = (perf as ExportPerformanceStats[]).map((p) => [
        p.studentName || "",
        p.email || "",
        p.courseTitle || "",
        Number(p.grade).toFixed(1),
        Number(p.submissionCount),
        Number(p.quizAttempts),
        Number(p.quizPassRate).toFixed(1),
      ]);
    } else if (type === "grades_detailed") {
      const grades = await prisma.$queryRaw`
        SELECT
          u.name,
          u.email,
          c.title as courseTitle,
          g.value as grade,
          g.scale,
          g.letterGrade,
          g.note,
          date(g.createdAt) as date
        FROM Grade g
        INNER JOIN User u ON u.id = g.studentId
        INNER JOIN CourseEnrollment ce ON ce.id = g.enrollmentId
        INNER JOIN Course c ON c.id = ce.courseId
        ORDER BY g.createdAt DESC
      `;

      headers = ["Student", "Email", "Course", "Grade", "Scale", "Letter", "Note", "Date"];
      rows = (grades as any[]).map((g) => [
        g.name || "",
        g.email || "",
        g.courseTitle || "",
        Number(g.grade).toFixed(1),
        g.scale || "PERCENT",
        g.letterGrade || "",
        g.note || "",
        g.date || "",
      ]);
    } else if (type === "cohort") {
      const cohort = await prisma.$queryRaw<ExportCohortStats[]>`
        SELECT
          strftime('%Y', ce.enrolledAt) || '-Q' || ((CAST(strftime('%m', ce.enrolledAt) AS INTEGER) - 1) / 3 + 1) as cohort,
          COUNT(DISTINCT ce.studentId) as studentCount,
          COALESCE(AVG(g.value), 0) as avgGrade,
          CASE WHEN COUNT(DISTINCT ce.studentId) > 0 THEN
            ROUND(CAST(COUNT(DISTINCT lc.studentId) AS FLOAT) / COUNT(DISTINCT ce.studentId) * 100, 1)
          ELSE 0 END as completionRate
        FROM CourseEnrollment ce
        LEFT JOIN Grade g ON g.enrollmentId = ce.id
        LEFT JOIN Lesson l ON l.courseId = ce.courseId
        LEFT JOIN LessonCompletion lc ON lc.lessonId = l.id AND lc.studentId = ce.studentId
        GROUP BY cohort
        ORDER BY cohort DESC
      `;

      headers = ["Cohort", "Students", "Avg Grade %", "Completion Rate %"];
      rows = (cohort as ExportCohortStats[]).map((c) => [
        c.cohort,
        Number(c.studentCount),
        Number(c.avgGrade).toFixed(1),
        Number(c.completionRate).toFixed(1),
      ]);
    } else if (type === "at_risk") {
      const atRisk = await prisma.$queryRaw<ExportAtRiskStats[]>`
        SELECT
          u.name,
          u.email,
          COALESCE(AVG(g.value), 0) as avgGrade,
          ROUND(
            (CASE WHEN COALESCE(AVG(g.value), 100) < 60 THEN 40 WHEN COALESCE(AVG(g.value), 100) < 70 THEN 20 ELSE 0 END) +
            (CASE WHEN MAX(vv.updatedAt) < datetime('now', '-14 days') OR MAX(vv.updatedAt) IS NULL THEN 30 WHEN MAX(vv.updatedAt) < datetime('now', '-7 days') THEN 15 ELSE 0 END),
            0
          ) as riskScore,
          GROUP_CONCAT(DISTINCT CASE
            WHEN AVG(g.value) < 60 THEN 'low_grades'
            WHEN MAX(vv.updatedAt) < datetime('now', '-14 days') THEN 'no_activity'
            ELSE ''
          END) as riskFactors
        FROM User u
        INNER JOIN CourseEnrollment ce ON ce.studentId = u.id
        LEFT JOIN Grade g ON g.enrollmentId = ce.id
        LEFT JOIN VideoView vv ON vv.userId = u.id
        WHERE u.role = 'STUDENT'
        GROUP BY u.id, u.name, u.email
        HAVING riskScore >= 50
        ORDER BY riskScore DESC
      `;

      headers = ["Student", "Email", "Avg Grade %", "Risk Score", "Risk Factors"];
      rows = (atRisk as ExportAtRiskStats[]).map((a) => [
        a.name || "",
        a.email || "",
        Number(a.avgGrade).toFixed(1),
        Number(a.riskScore),
        a.riskFactors || "",
      ]);
    } else {
      // Fallback to totals
      const stats = await prisma.$queryRaw`
        SELECT
          COALESCE(SUM(vv.watchedSeconds), 0) as totalSeconds,
          COUNT(DISTINCT vv.userId) as uniqueViewers,
          COUNT(*) as totalViews
        FROM VideoView vv
        WHERE 1=1 ${dateFilter}
      `;

      headers = ["Metric", "Value"];
      const statData = (stats as ExportTotalStats[])[0];
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
    return handleApiError(error, "analytics-export");
  }
}
