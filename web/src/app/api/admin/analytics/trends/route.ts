import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-errors";
import { NextResponse } from "next/server";
import type {
  SemesterAnalysis,
  MonthOverMonth,
  LearningVelocity,
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

    // 1. Semester analysis (grouped by year-half)
    const semesterResult = await prisma.$queryRaw<SemesterAnalysis[]>`
      SELECT
        strftime('%Y', ce.enrolledAt) || '-' || CASE WHEN CAST(strftime('%m', ce.enrolledAt) AS INTEGER) <= 6 THEN 'Spring' ELSE 'Fall' END as semester,
        MIN(date(ce.enrolledAt)) as startDate,
        MAX(date(ce.enrolledAt)) as endDate,
        COUNT(DISTINCT ce.id) as enrollmentCount,
        COALESCE(AVG(g.value), 0) as avgGrade,
        CASE WHEN COUNT(DISTINCT ce.studentId) > 0 THEN
          ROUND(CAST(COUNT(DISTINCT lc.studentId) AS FLOAT) / COUNT(DISTINCT ce.studentId) * 100, 1)
        ELSE 0 END as completionRate,
        CASE WHEN (SELECT COUNT(*) FROM QuizAttempt qa INNER JOIN Quiz q ON q.id = qa.quizId INNER JOIN Course c ON c.id = q.courseId INNER JOIN CourseEnrollment ce2 ON ce2.courseId = c.id AND ce2.studentId = ce.studentId) > 0 THEN
          ROUND(CAST((SELECT COUNT(*) FROM QuizAttempt qa INNER JOIN Quiz q ON q.id = qa.quizId INNER JOIN Course c ON c.id = q.courseId INNER JOIN CourseEnrollment ce2 ON ce2.courseId = c.id AND ce2.studentId = ce.studentId WHERE qa.passed = 1) AS FLOAT) / (SELECT COUNT(*) FROM QuizAttempt qa INNER JOIN Quiz q ON q.id = qa.quizId INNER JOIN Course c ON c.id = q.courseId INNER JOIN CourseEnrollment ce2 ON ce2.courseId = c.id AND ce2.studentId = ce.studentId) * 100, 1)
        ELSE 0 END as quizPassRate,
        COUNT(DISTINCT CASE WHEN vv.updatedAt >= datetime('now', '-30 days') THEN ce.studentId END) as activeStudents
      FROM CourseEnrollment ce
      LEFT JOIN Grade g ON g.enrollmentId = ce.id
      LEFT JOIN Lesson l ON l.courseId = ce.courseId
      LEFT JOIN LessonCompletion lc ON lc.lessonId = l.id AND lc.studentId = ce.studentId
      LEFT JOIN VideoView vv ON vv.userId = ce.studentId
      GROUP BY semester
      ORDER BY semester DESC
      LIMIT 6
    `;

    // 2. Month-over-month
    const momResult = await prisma.$queryRaw<MonthOverMonth[]>`
      SELECT
        strftime('%Y-%m', ce.enrolledAt) as month,
        COALESCE(AVG(g.value), 0) as avgGrade,
        COUNT(DISTINCT s.id) as totalSubmissions,
        CASE WHEN COUNT(DISTINCT qa.id) > 0 THEN
          ROUND(CAST(SUM(CASE WHEN qa.passed = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(DISTINCT qa.id) * 100, 1)
        ELSE 0 END as quizPassRate,
        COUNT(DISTINCT ce.id) as enrollmentCount
      FROM CourseEnrollment ce
      LEFT JOIN Grade g ON g.enrollmentId = ce.id
      LEFT JOIN CourseEnrollment ce2 ON ce2.studentId = ce.studentId AND ce2.courseId = ce.courseId
      LEFT JOIN Assignment a ON a.courseId = ce.courseId
      LEFT JOIN Submission s ON s.assignmentId = a.id AND s.studentId = ce.studentId
      LEFT JOIN Quiz q ON q.courseId = ce.courseId
      LEFT JOIN QuizAttempt qa ON qa.quizId = q.id AND qa.studentId = ce.studentId
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `;

    // 3. Learning velocity (top/bottom students by weekly completions)
    const velocityResult = await prisma.$queryRaw<LearningVelocity[]>`
      SELECT
        u.id as studentId,
        u.name,
        u.email,
        ROUND(CAST(COUNT(DISTINCT lc.id) AS FLOAT) / MAX(1, CAST((julianday('now') - julianday(MIN(lc.completedAt))) AS FLOAT) / 7), 2) as completionsPerWeek
      FROM User u
      INNER JOIN LessonCompletion lc ON lc.studentId = u.id
      WHERE u.role = 'STUDENT'
      GROUP BY u.id, u.name, u.email
      ORDER BY completionsPerWeek DESC
      LIMIT 10
    `;

    const momData = (momResult as MonthOverMonth[]).map((m) => ({
      month: m.month,
      avgGrade: Number(m.avgGrade),
      totalSubmissions: Number(m.totalSubmissions),
      quizPassRate: Number(m.quizPassRate),
      enrollmentCount: Number(m.enrollmentCount),
    }));

    // Compute month-over-month changes
    const momWithChange = momData.map((m, i) => {
      const prev = momData[i + 1];
      return {
        ...m,
        gradeChange: prev ? ((m.avgGrade - prev.avgGrade) / Math.max(prev.avgGrade, 0.01)) * 100 : 0,
        submissionChange: prev ? m.totalSubmissions - prev.totalSubmissions : 0,
        enrollmentChange: prev ? m.enrollmentCount - prev.enrollmentCount : 0,
      };
    });

    // Compute trend for velocity
    const avgVelocity = velocityResult.reduce((sum, v) => sum + Number(v.completionsPerWeek), 0) / Math.max(velocityResult.length, 1);
    const velocityData = (velocityResult as LearningVelocity[]).map((v) => ({
      studentId: v.studentId,
      name: v.name,
      email: v.email,
      completionsPerWeek: Number(v.completionsPerWeek),
      trend: Number(v.completionsPerWeek) > avgVelocity * 1.2 ? "improving" : Number(v.completionsPerWeek) < avgVelocity * 0.8 ? "declining" : "stable",
    }));

    return NextResponse.json({
      semesterAnalysis: (semesterResult as SemesterAnalysis[]).map((s) => ({
        semester: s.semester,
        startDate: s.startDate,
        endDate: s.endDate,
        enrollmentCount: Number(s.enrollmentCount),
        avgGrade: Number(s.avgGrade),
        completionRate: Number(s.completionRate),
        quizPassRate: Number(s.quizPassRate),
        activeStudents: Number(s.activeStudents),
      })),
      monthOverMonth: momWithChange,
      learningVelocity: velocityData,
    });
  } catch (error) {
    return handleApiError(error, "analytics-trends");
  }
}
