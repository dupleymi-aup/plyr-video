import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-errors";
import { NextResponse } from "next/server";
import type {
  PerformanceOverview,
  PerformanceTrend,
  CoursePerformanceComparison,
  SubmissionCompletionRate,
  QuizPassRateTrend,
  PerformanceDistribution,
  CohortData,
  AtRiskStudent,
} from "@/types/analytics";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const granularity = searchParams.get("granularity") || "daily";

    const dateFilter = startDate || endDate
      ? prisma.sql`WHERE s.submittedAt >= ${startDate ? new Date(startDate) : new Date("2000-01-01")} AND s.submittedAt <= ${endDate ? new Date(endDate) : new Date("2100-12-31")}`
      : prisma.sql``;

    const dateFilterInner = startDate || endDate
      ? prisma.sql`AND s.submittedAt >= ${startDate ? new Date(startDate) : new Date("2000-01-01")} AND s.submittedAt <= ${endDate ? new Date(endDate) : new Date("2100-12-31")}`
      : prisma.sql``;

    const dateFilterQa = startDate || endDate
      ? prisma.sql`WHERE qa.completedAt >= ${startDate ? new Date(startDate) : new Date("2000-01-01")} AND qa.completedAt <= ${endDate ? new Date(endDate) : new Date("2100-12-31")}`
      : prisma.sql``;

    // 1. Performance overview
    const overviewResult = await prisma.$queryRaw<PerformanceOverview[]>`
      SELECT
        COUNT(*) as totalSubmissions,
        COALESCE((SELECT COUNT(*) FROM QuizAttempt), 0) as totalQuizAttempts,
        COALESCE(AVG(s.score), 0) as avgSubmissionScore,
        COALESCE((SELECT AVG(score) FROM QuizAttempt WHERE score IS NOT NULL), 0) as avgQuizScore,
        CASE WHEN COUNT(*) > 0 THEN
          ROUND(CAST(SUM(CASE WHEN s.score IS NOT NULL THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 1)
        ELSE 0 END as submissionCompletionRate,
        CASE WHEN (SELECT COUNT(*) FROM QuizAttempt) > 0 THEN
          ROUND(CAST((SELECT COUNT(*) FROM QuizAttempt WHERE passed = 1) AS FLOAT) / (SELECT COUNT(*) FROM QuizAttempt) * 100, 1)
        ELSE 0 END as quizPassRate
      FROM Submission s
    `;

    // 2. Performance trend
    const trendResult = await prisma.$queryRaw<PerformanceTrend[]>`
      SELECT
        date(s.submittedAt) as date,
        COALESCE(AVG(s.score), 0) as avgScore,
        COUNT(*) as submissionCount,
        COALESCE((
          SELECT COUNT(*) FROM QuizAttempt qa
          WHERE date(qa.completedAt) = date(s.submittedAt)
        ), 0) as quizAttemptCount
      FROM Submission s
      ${dateFilter}
      GROUP BY date(s.submittedAt)
      ORDER BY date ASC
    `;

    // 3. Course comparisons
    const courseCompResult = await prisma.$queryRaw<CoursePerformanceComparison[]>`
      SELECT
        c.id as courseId,
        c.title as courseTitle,
        u.name as teacherName,
        COUNT(DISTINCT ce.studentId) as studentCount,
        COALESCE(AVG(g.value), 0) as avgGrade,
        COALESCE((
          SELECT AVG(sub.score) FROM Submission sub
          INNER JOIN Assignment a ON a.id = sub.assignmentId
          WHERE a.courseId = c.id AND sub.score IS NOT NULL
        ), 0) as avgSubmissionScore,
        COALESCE((
          SELECT AVG(qa.score) FROM QuizAttempt qa
          INNER JOIN Quiz q ON q.id = qa.quizId
          WHERE q.courseId = c.id AND qa.score IS NOT NULL
        ), 0) as avgQuizScore,
        CASE WHEN COUNT(DISTINCT ce.studentId) > 0 THEN
          ROUND(CAST(COUNT(DISTINCT lc.studentId) AS FLOAT) / COUNT(DISTINCT ce.studentId) * 100, 1)
        ELSE 0 END as completionRate
      FROM Course c
      INNER JOIN User u ON c.teacherId = u.id
      LEFT JOIN CourseEnrollment ce ON ce.courseId = c.id
      LEFT JOIN Grade g ON g.enrollmentId = ce.id
      LEFT JOIN Lesson l ON l.courseId = c.id
      LEFT JOIN LessonCompletion lc ON lc.lessonId = l.id AND lc.studentId = ce.studentId
      WHERE c.status != 'DRAFT'
      GROUP BY c.id, c.title, u.name
      ORDER BY avgGrade DESC
      LIMIT 10
    `;

    // 4. Submission rates per course
    const subRateResult = await prisma.$queryRaw<SubmissionCompletionRate[]>`
      SELECT
        c.id as courseId,
        c.title as courseTitle,
        (SELECT COUNT(*) FROM Assignment a WHERE a.courseId = c.id) as totalAssignments,
        COUNT(DISTINCT s.id) as totalSubmissions,
        CASE WHEN (SELECT COUNT(*) FROM Assignment a WHERE a.courseId = c.id) * COUNT(DISTINCT ce.studentId) > 0 THEN
          ROUND(CAST(COUNT(DISTINCT s.id) AS FLOAT) / ((SELECT COUNT(*) FROM Assignment a WHERE a.courseId = c.id) * COUNT(DISTINCT ce.studentId)) * 100, 1)
        ELSE 0 END as completionRate,
        COALESCE(AVG(s.score), 0) as avgScore
      FROM Course c
      LEFT JOIN CourseEnrollment ce ON ce.courseId = c.id
      LEFT JOIN Assignment a ON a.courseId = c.id
      LEFT JOIN Submission s ON s.assignmentId = a.id AND s.studentId = ce.studentId
      WHERE c.status != 'DRAFT'
      GROUP BY c.id, c.title
      ORDER BY completionRate DESC
    `;

    // 5. Quiz pass rate trend
    const quizTrendResult = await prisma.$queryRaw<QuizPassRateTrend[]>`
      SELECT
        date(qa.completedAt) as date,
        COUNT(*) as totalAttempts,
        SUM(CASE WHEN qa.passed = 1 THEN 1 ELSE 0 END) as passedCount,
        ROUND(CAST(SUM(CASE WHEN qa.passed = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 1) as passRate,
        COALESCE(AVG(qa.score), 0) as avgScore
      FROM QuizAttempt qa
      ${dateFilterQa}
      GROUP BY date(qa.completedAt)
      ORDER BY date ASC
    `;

    // 6. Performance distribution (grade buckets)
    const distResult = await prisma.$queryRaw<PerformanceDistribution[]>`
      SELECT
        CASE
          WHEN g.value >= 90 THEN '90-100'
          WHEN g.value >= 80 THEN '80-89'
          WHEN g.value >= 70 THEN '70-79'
          WHEN g.value >= 60 THEN '60-69'
          ELSE '0-59'
        END as range,
        COUNT(DISTINCT g.studentId) as studentCount,
        ROUND(CAST(COUNT(DISTINCT g.studentId) AS FLOAT) / NULLIF((SELECT COUNT(DISTINCT studentId) FROM Grade), 0) * 100, 1) as percentage
      FROM Grade g
      GROUP BY range
      ORDER BY range DESC
    `;

    // 7. Cohort analysis (grouped by enrollment quarter)
    const cohortResult = await prisma.$queryRaw<CohortData[]>`
      SELECT
        strftime('%Y', ce.enrolledAt) || '-Q' || ((CAST(strftime('%m', ce.enrolledAt) AS INTEGER) - 1) / 3 + 1) as cohortLabel,
        COUNT(DISTINCT ce.studentId) as studentCount,
        COALESCE(AVG(g.value), 0) as avgGrade,
        CASE WHEN COUNT(DISTINCT ce.studentId) > 0 THEN
          ROUND(CAST(COUNT(DISTINCT lc.studentId) AS FLOAT) / COUNT(DISTINCT ce.studentId) * 100, 1)
        ELSE 0 END as completionRate,
        COUNT(DISTINCT CASE WHEN vv.createdAt >= datetime('now', '-30 days') THEN ce.studentId END) as activeStudents
      FROM CourseEnrollment ce
      LEFT JOIN Grade g ON g.enrollmentId = ce.id
      LEFT JOIN LessonCompletion lc ON lc.studentId = ce.studentId
      LEFT JOIN VideoView vv ON vv.userId = ce.studentId
      GROUP BY cohortLabel
      ORDER BY cohortLabel DESC
      LIMIT 8
    `;

    // 8. At-risk students
    const atRiskResult = await prisma.$queryRaw<AtRiskStudent[]>`
      SELECT
        u.id,
        u.name,
        u.email,
        COALESCE(AVG(g.value), 0) as avgGrade,
        COUNT(DISTINCT ce.courseId) as coursesEnrolled,
        COUNT(DISTINCT CASE WHEN g.value < 60 THEN ce.courseId END) as coursesAtRisk,
        MAX(vv.updatedAt) as lastActivityDate,
        ROUND(
          (CASE WHEN COALESCE(AVG(g.value), 100) < 60 THEN 40 WHEN COALESCE(AVG(g.value), 100) < 70 THEN 20 ELSE 0 END) +
          (CASE WHEN MAX(vv.updatedAt) < datetime('now', '-14 days') OR MAX(vv.updatedAt) IS NULL THEN 30 WHEN MAX(vv.updatedAt) < datetime('now', '-7 days') THEN 15 ELSE 0 END) +
          (CASE WHEN CAST(COUNT(DISTINCT s.id) AS FLOAT) / NULLIF((SELECT COUNT(*) FROM Assignment a INNER JOIN CourseEnrollment ce2 ON ce2.courseId = a.courseId WHERE ce2.studentId = u.id), 0) < 0.5 THEN 30
                WHEN CAST(COUNT(DISTINCT s.id) AS FLOAT) / NULLIF((SELECT COUNT(*) FROM Assignment a INNER JOIN CourseEnrollment ce2 ON ce2.courseId = a.courseId WHERE ce2.studentId = u.id), 0) < 0.75 THEN 15
                ELSE 0 END),
          0
        ) as riskScore
      FROM User u
      INNER JOIN CourseEnrollment ce ON ce.studentId = u.id
      LEFT JOIN Grade g ON g.enrollmentId = ce.id
      LEFT JOIN VideoView vv ON vv.userId = u.id
      LEFT JOIN CourseEnrollment ce2 ON ce2.studentId = u.id
      LEFT JOIN Assignment a ON a.courseId = ce2.courseId
      LEFT JOIN Submission s ON s.assignmentId = a.id AND s.studentId = u.id
      WHERE u.role = 'STUDENT'
      GROUP BY u.id, u.name, u.email
      HAVING riskScore >= 50
      ORDER BY riskScore DESC
      LIMIT 20
    `;

    const overview = (overviewResult as PerformanceOverview[])[0];

    // Build risk factors for at-risk students
    const atRiskStudents = (atRiskResult as AtRiskStudent[]).map((s) => {
      const factors: string[] = [];
      const avgGrade = Number(s.avgGrade);
      const lastActivity = s.lastActivityDate ? new Date(s.lastActivityDate) : null;
      const daysSinceActivity = lastActivity ? Math.floor((Date.now() - lastActivity.getTime()) / 86400000) : 999;

      if (avgGrade < 60) factors.push("lowGrades");
      else if (avgGrade < 70) factors.push("lowGrades");
      if (daysSinceActivity > 14) factors.push("noRecentActivity");
      if (Number(s.coursesAtRisk) > 0) factors.push("fallingBehind");

      return {
        ...s,
        riskFactors: factors,
        avgGrade: Number(s.avgGrade),
        lastActivityDate: s.lastActivityDate,
        coursesEnrolled: Number(s.coursesEnrolled),
        coursesAtRisk: Number(s.coursesAtRisk),
        riskScore: Number(s.riskScore),
      };
    });

    return NextResponse.json({
      overview: {
        totalSubmissions: Number(overview?.totalSubmissions ?? 0),
        totalQuizAttempts: Number(overview?.totalQuizAttempts ?? 0),
        avgSubmissionScore: Number(overview?.avgSubmissionScore ?? 0),
        avgQuizScore: Number(overview?.avgQuizScore ?? 0),
        submissionCompletionRate: Number(overview?.submissionCompletionRate ?? 0),
        quizPassRate: Number(overview?.quizPassRate ?? 0),
      },
      performanceTrend: (trendResult as PerformanceTrend[]).map((t) => ({
        date: t.date,
        avgScore: Number(t.avgScore),
        submissionCount: Number(t.submissionCount),
        quizAttemptCount: Number(t.quizAttemptCount),
      })),
      courseComparisons: (courseCompResult as CoursePerformanceComparison[]).map((c) => ({
        courseId: c.courseId,
        courseTitle: c.courseTitle,
        teacherName: c.teacherName,
        studentCount: Number(c.studentCount),
        avgGrade: Number(c.avgGrade),
        avgSubmissionScore: Number(c.avgSubmissionScore),
        avgQuizScore: Number(c.avgQuizScore),
        completionRate: Number(c.completionRate),
      })),
      submissionRates: (subRateResult as SubmissionCompletionRate[]).map((s) => ({
        courseId: s.courseId,
        courseTitle: s.courseTitle,
        totalAssignments: Number(s.totalAssignments),
        totalSubmissions: Number(s.totalSubmissions),
        completionRate: Number(s.completionRate),
        avgScore: Number(s.avgScore),
      })),
      quizPassRateTrend: (quizTrendResult as QuizPassRateTrend[]).map((q) => ({
        date: q.date,
        totalAttempts: Number(q.totalAttempts),
        passedCount: Number(q.passedCount),
        passRate: Number(q.passRate),
        avgScore: Number(q.avgScore),
      })),
      performanceDistribution: (distResult as PerformanceDistribution[]).map((d) => ({
        range: d.range,
        studentCount: Number(d.studentCount),
        percentage: Number(d.percentage),
      })),
      cohortAnalysis: (cohortResult as CohortData[]).map((c) => ({
        cohortLabel: c.cohortLabel,
        studentCount: Number(c.studentCount),
        avgGrade: Number(c.avgGrade),
        completionRate: Number(c.completionRate),
        activeStudents: Number(c.activeStudents),
      })),
      atRiskStudents,
    });
  } catch (error) {
    return handleApiError(error, "analytics-performance");
  }
}
