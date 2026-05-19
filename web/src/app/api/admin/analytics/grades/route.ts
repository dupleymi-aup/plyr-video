import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-errors";
import { NextResponse } from "next/server";
import type {
  GradeOverview,
  GradeDistributionWithAvg,
  CourseGradeWithDetails,
  StudentWithGradeDetails,
} from "@/types/analytics";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter = startDate || endDate
      ? prisma.sql`WHERE g.createdAt >= ${startDate ? new Date(startDate) : new Date("2000-01-01")} AND g.createdAt <= ${endDate ? new Date(endDate) : new Date("2100-12-31")}`
      : prisma.sql``;

    const dateFilterInner = startDate || endDate
      ? prisma.sql`AND g.createdAt >= ${startDate ? new Date(startDate) : new Date("2000-01-01")} AND g.createdAt <= ${endDate ? new Date(endDate) : new Date("2100-12-31")}`
      : prisma.sql``;

    // 1. Grade overview
    const overviewResult = await prisma.$queryRaw`
      SELECT
        COUNT(*) as totalGrades,
        COALESCE(AVG(g.value), 0) as avgGrade,
        COALESCE(MIN(g.value), 0) as minGrade,
        COALESCE(MAX(g.value), 0) as maxGrade,
        SUM(CASE WHEN g.value >= 60 THEN 1 ELSE 0 END) as passing
      FROM Grade g
      ${dateFilter}
    `;

    // 2. Grade distribution by letter
    const distributionResult = await prisma.$queryRaw`
      SELECT
        CASE
          WHEN g.value >= 90 THEN 'A'
          WHEN g.value >= 80 THEN 'B'
          WHEN g.value >= 70 THEN 'C'
          WHEN g.value >= 60 THEN 'D'
          ELSE 'F'
        END as bucket,
        COUNT(*) as count,
        COALESCE(AVG(g.value), 0) as avgValue
      FROM Grade g
      ${dateFilter}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    // 3. Per-course grade stats
    const courseGradesResult = await prisma.$queryRaw`
      SELECT
        c.id,
        c.title,
        u.name as teacherName,
        COUNT(g.id) as gradeCount,
        COALESCE(AVG(g.value), 0) as avgGrade,
        COALESCE(MIN(g.value), 0) as minGrade,
        COALESCE(MAX(g.value), 0) as maxGrade,
        SUM(CASE WHEN g.value >= 60 THEN 1 ELSE 0 END) as passing,
        COUNT(g.id) as total
      FROM Course c
      INNER JOIN User u ON c.teacherId = u.id
      INNER JOIN CourseEnrollment ce ON ce.courseId = c.id
      INNER JOIN Grade g ON g.enrollmentId = ce.id
      WHERE c.status != 'DRAFT'
      ${dateFilterInner}
      GROUP BY c.id, c.title, u.name
      ORDER BY avgGrade DESC
    `;

    // 4. Top 10 students by average grade
    const topStudentsResult = await prisma.$queryRaw`
      SELECT
        u.id,
        u.name,
        u.email,
        COUNT(g.id) as gradeCount,
        COALESCE(AVG(g.value), 0) as avgGrade,
        COUNT(DISTINCT c.id) as coursesCompleted
      FROM User u
      INNER JOIN Grade g ON g.studentId = u.id
      INNER JOIN CourseEnrollment ce ON ce.id = g.enrollmentId
      INNER JOIN Course c ON c.id = ce.courseId
      WHERE u.role = 'STUDENT' AND c.status != 'DRAFT'
      ${dateFilterInner}
      GROUP BY u.id, u.name, u.email
      ORDER BY avgGrade DESC
      LIMIT 10
    `;

    // 5. Bottom 10 students
    const strugglingResult = await prisma.$queryRaw`
      SELECT
        u.id,
        u.name,
        u.email,
        COUNT(g.id) as gradeCount,
        COALESCE(AVG(g.value), 0) as avgGrade,
        COUNT(DISTINCT c.id) as coursesCompleted
      FROM User u
      INNER JOIN Grade g ON g.studentId = u.id
      INNER JOIN CourseEnrollment ce ON ce.id = g.enrollmentId
      INNER JOIN Course c ON c.id = ce.courseId
      WHERE u.role = 'STUDENT' AND c.status != 'DRAFT'
      ${dateFilterInner}
      GROUP BY u.id, u.name, u.email
      ORDER BY avgGrade ASC
      LIMIT 10
    `;

    const overview = (overviewResult as GradeOverview[])[0];
    const totalGrades = Number(overview?.totalGrades ?? 0);

    return NextResponse.json({
      overview: {
        totalGrades,
        avgGrade: Number(overview?.avgGrade ?? 0),
        minGrade: Number(overview?.minGrade ?? 0),
        maxGrade: Number(overview?.maxGrade ?? 0),
        passRate: totalGrades > 0 ? (Number(overview?.passing ?? 0) / totalGrades) * 100 : 0,
      },
      gradeDistribution: (distributionResult as GradeDistributionWithAvg[]).map((d) => ({
        bucket: d.bucket,
        count: Number(d.count),
        avgValue: Number(d.avgValue),
      })),
      courseGrades: (courseGradesResult as CourseGradeWithDetails[]).map((c) => ({
        id: c.id,
        title: c.title,
        teacherName: c.teacherName,
        gradeCount: Number(c.gradeCount),
        avgGrade: Number(c.avgGrade),
        minGrade: Number(c.minGrade),
        maxGrade: Number(c.maxGrade),
        passRate: Number(c.total) > 0 ? (Number(c.passing) / Number(c.total)) * 100 : 0,
      })),
      topStudents: (topStudentsResult as StudentWithGradeDetails[]).map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        gradeCount: Number(s.gradeCount),
        avgGrade: Number(s.avgGrade),
        coursesCompleted: Number(s.coursesCompleted),
      })),
      strugglingStudents: (strugglingResult as StudentWithGradeDetails[]).map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        gradeCount: Number(s.gradeCount),
        avgGrade: Number(s.avgGrade),
        coursesCompleted: Number(s.coursesCompleted),
      })),
    });
  } catch (error) {
    return handleApiError(error, "analytics-grades");
  }
}
