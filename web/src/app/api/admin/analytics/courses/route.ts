import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter = startDate || endDate
      ? prisma.sql`WHERE ce.enrolledAt >= ${startDate ? new Date(startDate) : new Date("2000-01-01")} AND ce.enrolledAt <= ${endDate ? new Date(endDate) : new Date("2100-12-31")}`
      : prisma.sql``;

    // 1. Course overview aggregates
    const [totalCoursesResult, totalEnrollmentsResult] = await Promise.all([
      prisma.course.count(),
      prisma.courseEnrollment.count(),
    ]);

    const [avgGradeResult, totalCompletionsResult, totalAttemptsResult] = await Promise.all([
      prisma.$queryRaw`SELECT COALESCE(AVG(value), 0) as avgGrade FROM Grade`,
      prisma.lessonCompletion.count(),
      prisma.quizAttempt.count(),
    ]);

    // 2. Top 10 courses by enrollment
    const topCoursesResult = await prisma.$queryRaw`
      SELECT
        c.id,
        c.title,
        c.status,
        u.name as teacherName,
        COUNT(DISTINCT ce.id) as enrollmentCount,
        COUNT(DISTINCT lc.studentId) as completionCount,
        COALESCE(AVG(g.value), 0) as avgGrade
      FROM Course c
      INNER JOIN User u ON c.teacherId = u.id
      LEFT JOIN CourseEnrollment ce ON ce.courseId = c.id
      LEFT JOIN LessonCompletion lc ON lc.studentId = ce.studentId
      LEFT JOIN Grade g ON g.enrollmentId = ce.id
      GROUP BY c.id, c.title, c.status, u.name
      ORDER BY enrollmentCount DESC
      LIMIT 10
    `;

    // 3. Grade distribution
    const gradeDistResult = await prisma.$queryRaw`
      SELECT
        CASE
          WHEN value >= 90 THEN 'A'
          WHEN value >= 80 THEN 'B'
          WHEN value >= 70 THEN 'C'
          WHEN value >= 60 THEN 'D'
          ELSE 'F'
        END as bucket,
        COUNT(*) as count
      FROM Grade
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    // 4. Enrollment trend (daily, last 90 days)
    const trendResult = await prisma.$queryRaw`
      SELECT
        date(enrolledAt) as date,
        COUNT(*) as enrollments
      FROM CourseEnrollment
      WHERE enrolledAt >= datetime('now', '-90 days')
      GROUP BY date(enrolledAt)
      ORDER BY date(enrolledAt) ASC
    `;

    // 5. Quiz pass rate
    const quizStatsResult = await prisma.$queryRaw`
      SELECT
        q.title as quizTitle,
        c.title as courseTitle,
        COUNT(qa.id) as totalAttempts,
        COALESCE(AVG(qa.score), 0) as avgScore,
        SUM(CASE WHEN qa.passed = 1 THEN 1 ELSE 0 END) as passedCount
      FROM QuizAttempt qa
      INNER JOIN Quiz q ON qa.quizId = q.id
      INNER JOIN Course c ON q.courseId = c.id
      GROUP BY q.id, q.title, c.title
      ORDER BY totalAttempts DESC
      LIMIT 10
    `;

    // 6. Lesson completion per course
    const lessonCompletionResult = await prisma.$queryRaw`
      SELECT
        c.id,
        c.title,
        COUNT(DISTINCT l.id) as totalLessons,
        COUNT(DISTINCT lc.id) as totalCompletions,
        COUNT(DISTINCT ce.studentId) as enrolledStudents
      FROM Course c
      LEFT JOIN Lesson l ON l.courseId = c.id
      LEFT JOIN CourseEnrollment ce ON ce.courseId = c.id
      LEFT JOIN LessonCompletion lc ON lc.lessonId = l.id AND lc.studentId = ce.studentId
      GROUP BY c.id, c.title
      HAVING enrolledStudents > 0
      ORDER BY CAST(totalCompletions AS FLOAT) / NULLIF(totalLessons * enrolledStudents, 0) DESC
      LIMIT 10
    `;

    return NextResponse.json({
      overview: {
        totalCourses: totalCoursesResult,
        totalEnrollments: totalEnrollmentsResult,
        avgGrade: Number((avgGradeResult as any[])[0]?.avgGrade ?? 0),
        totalCompletions: totalCompletionsResult,
        totalQuizAttempts: totalAttemptsResult,
        quizPassRate: totalAttemptsResult > 0 ? 0 : 0, // will be computed from quizStats
      },
      topCourses: (topCoursesResult as any[]).map((c: any) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        teacherName: c.teacherName,
        enrollmentCount: Number(c.enrollmentCount),
        completionCount: Number(c.completionCount),
        avgGrade: Number(c.avgGrade),
      })),
      gradeDistribution: (gradeDistResult as any[]).map((d: any) => ({
        bucket: d.bucket,
        count: Number(d.count),
      })),
      enrollmentTrend: (trendResult as any[]).map((t: any) => ({
        date: t.date,
        enrollments: Number(t.enrollments),
      })),
      quizStats: (quizStatsResult as any[]).map((q: any) => ({
        quizTitle: q.quizTitle,
        courseTitle: q.courseTitle,
        totalAttempts: Number(q.totalAttempts),
        avgScore: Number(q.avgScore),
        passedCount: Number(q.passedCount),
        passRate: Number(q.totalAttempts) > 0 ? (Number(q.passedCount) / Number(q.totalAttempts)) * 100 : 0,
      })),
      lessonCompletionStats: (lessonCompletionResult as any[]).map((c: any) => ({
        id: c.id,
        title: c.title,
        totalLessons: Number(c.totalLessons),
        totalCompletions: Number(c.totalCompletions),
        enrolledStudents: Number(c.enrolledStudents),
        completionRate: (Number(c.totalLessons) * Number(c.enrolledStudents)) > 0
          ? (Number(c.totalCompletions) / (Number(c.totalLessons) * Number(c.enrolledStudents))) * 100
          : 0,
      })),
    });
  } catch (error) {
    console.error("Course analytics API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
