import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-errors";
import { NextResponse } from "next/server";
import type {
  StudentComparison,
  TeacherPerformance,
  CourseDifficultyIndex,
} from "@/types/analytics";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "students";
    const courseId = searchParams.get("courseId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter = startDate || endDate
      ? prisma.sql`AND ce.enrolledAt >= ${startDate ? new Date(startDate) : new Date("2000-01-01")} AND ce.enrolledAt <= ${endDate ? new Date(endDate) : new Date("2100-12-31")}`
      : prisma.sql``;

    const courseFilter = courseId ? prisma.sql`AND c.id = ${courseId}` : prisma.sql``;

    if (type === "students") {
      // Student comparison within courses
      const studentResult = await prisma.$queryRaw<StudentComparison[]>`
        SELECT
          u.id as studentId,
          u.name,
          u.email,
          c.title as courseTitle,
          COALESCE(AVG(g.value), 0) as grade,
          COUNT(DISTINCT s.id) as submissionCount,
          COUNT(DISTINCT qa.id) as quizAttempts,
          CASE WHEN COUNT(DISTINCT qa.id) > 0 THEN
            ROUND(CAST(SUM(CASE WHEN qa.passed = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(DISTINCT qa.id) * 100, 1)
          ELSE 0 END as quizPassRate,
          CASE WHEN (SELECT COUNT(*) FROM Lesson l WHERE l.courseId = c.id) > 0 THEN
            ROUND(CAST(COUNT(DISTINCT lc.id) AS FLOAT) / (SELECT COUNT(*) FROM Lesson l WHERE l.courseId = c.id) * 100, 1)
          ELSE 0 END as completionRate
        FROM CourseEnrollment ce
        INNER JOIN User u ON u.id = ce.studentId
        INNER JOIN Course c ON c.id = ce.courseId
        LEFT JOIN Grade g ON g.enrollmentId = ce.id
        LEFT JOIN CourseEnrollment ce2 ON ce2.studentId = u.id AND ce2.courseId = c.id
        LEFT JOIN Assignment a ON a.courseId = c.id
        LEFT JOIN Submission s ON s.assignmentId = a.id AND s.studentId = u.id
        LEFT JOIN Quiz q ON q.courseId = c.id
        LEFT JOIN QuizAttempt qa ON qa.quizId = q.id AND qa.studentId = u.id
        LEFT JOIN Lesson l ON l.courseId = c.id
        LEFT JOIN LessonCompletion lc ON lc.lessonId = l.id AND lc.studentId = u.id
        WHERE u.role = 'STUDENT' AND c.status != 'DRAFT'
        ${courseFilter}
        ${dateFilter}
        GROUP BY u.id, u.name, u.email, c.id, c.title
        ORDER BY grade DESC
        LIMIT 50
      `;

      return NextResponse.json({
        studentComparisons: (studentResult as StudentComparison[]).map((s) => ({
          studentId: s.studentId,
          name: s.name,
          email: s.email,
          courseTitle: s.courseTitle,
          grade: Number(s.grade),
          submissionCount: Number(s.submissionCount),
          quizAttempts: Number(s.quizAttempts),
          quizPassRate: Number(s.quizPassRate),
          completionRate: Number(s.completionRate),
        })),
      });
    }

    if (type === "teachers") {
      // Teacher performance
      const teacherResult = await prisma.$queryRaw<TeacherPerformance[]>`
        SELECT
          u.id as teacherId,
          u.name as teacherName,
          COUNT(DISTINCT c.id) as courseCount,
          COUNT(DISTINCT ce.studentId) as totalStudents,
          COALESCE(AVG(g.value), 0) as avgGrade,
          COALESCE((
            SELECT AVG(qa.score) FROM QuizAttempt qa
            INNER JOIN Quiz q ON q.id = qa.quizId
            INNER JOIN Course c2 ON c2.id = q.courseId
            WHERE c2.teacherId = u.id AND qa.score IS NOT NULL
          ), 0) as avgQuizScore,
          CASE WHEN (SELECT COUNT(*) FROM QuizAttempt qa INNER JOIN Quiz q ON q.id = qa.quizId INNER JOIN Course c2 ON c2.id = q.courseId WHERE c2.teacherId = u.id) > 0 THEN
            ROUND(CAST((SELECT COUNT(*) FROM QuizAttempt qa INNER JOIN Quiz q ON q.id = qa.quizId INNER JOIN Course c2 ON c2.id = q.courseId WHERE c2.teacherId = u.id AND qa.passed = 1) AS FLOAT) / (SELECT COUNT(*) FROM QuizAttempt qa INNER JOIN Quiz q ON q.id = qa.quizId INNER JOIN Course c2 ON c2.id = q.courseId WHERE c2.teacherId = u.id) * 100, 1)
          ELSE 0 END as passRate
        FROM User u
        INNER JOIN Course c ON c.teacherId = u.id
        LEFT JOIN CourseEnrollment ce ON ce.courseId = c.id
        LEFT JOIN Grade g ON g.enrollmentId = ce.id
        WHERE u.role IN ('TEACHER', 'ADMIN')
        GROUP BY u.id, u.name
        ORDER BY avgGrade DESC
      `;

      return NextResponse.json({
        teacherPerformance: (teacherResult as TeacherPerformance[]).map((t) => ({
          teacherId: t.teacherId,
          teacherName: t.teacherName,
          courseCount: Number(t.courseCount),
          totalStudents: Number(t.totalStudents),
          avgGrade: Number(t.avgGrade),
          avgQuizScore: Number(t.avgQuizScore),
          passRate: Number(t.passRate),
        })),
      });
    }

    // Default: course difficulty
    const difficultyResult = await prisma.$queryRaw<CourseDifficultyIndex[]>`
      SELECT
        c.id as courseId,
        c.title as courseTitle,
        COALESCE(AVG(g.value), 0) as avgGrade,
        ROUND(SQRT(MAX(AVG(g.value * g.value) - AVG(g.value) * AVG(g.value), 0)), 2) as gradeStdDev,
        CASE WHEN COUNT(DISTINCT g.studentId) > 0 THEN
          ROUND(CAST(COUNT(DISTINCT CASE WHEN g.value < 60 THEN g.studentId END) AS FLOAT) / COUNT(DISTINCT g.studentId) * 100, 1)
        ELSE 0 END as failureRate,
        ROUND(
          (100 - COALESCE(AVG(g.value), 50)) * 0.5 +
          CASE WHEN COALESCE(AVG(g.value), 50) < 60 THEN 30 WHEN COALESCE(AVG(g.value), 50) < 75 THEN 15 ELSE 0 END,
          1
        ) as difficultyScore
      FROM Course c
      LEFT JOIN CourseEnrollment ce ON ce.courseId = c.id
      LEFT JOIN Grade g ON g.enrollmentId = ce.id
      WHERE c.status != 'DRAFT'
      GROUP BY c.id, c.title
      ORDER BY difficultyScore DESC
    `;

    return NextResponse.json({
      courseDifficulty: (difficultyResult as CourseDifficultyIndex[]).map((c) => ({
        courseId: c.courseId,
        courseTitle: c.courseTitle,
        avgGrade: Number(c.avgGrade),
        gradeStdDev: Number(c.gradeStdDev),
        failureRate: Number(c.failureRate),
        difficultyScore: Number(c.difficultyScore),
      })),
    });
  } catch (error) {
    return handleApiError(error, "analytics-comparative");
  }
}
