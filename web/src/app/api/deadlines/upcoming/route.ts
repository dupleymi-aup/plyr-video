import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [upcomingAssignments, upcomingQuizzes, overdueAssignments] = await Promise.all([
    prisma.assignment.findMany({
      where: {
        dueDate: { gte: now, lte: sevenDaysFromNow },
        course: {
          enrollments: { some: { studentId: session.user.id } },
          status: "PUBLISHED",
        },
        submissions: { none: { studentId: session.user.id } },
      },
      include: {
        course: { select: { id: true, title: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),

    prisma.quiz.findMany({
      where: {
        dueDate: { gte: now, lte: sevenDaysFromNow },
        course: {
          enrollments: { some: { studentId: session.user.id } },
          status: "PUBLISHED",
        },
        attempts: { none: { studentId: session.user.id } },
      },
      include: {
        course: { select: { id: true, title: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),

    prisma.assignment.findMany({
      where: {
        dueDate: { lt: now },
        course: {
          enrollments: { some: { studentId: session.user.id } },
          status: "PUBLISHED",
        },
        submissions: { none: { studentId: session.user.id } },
      },
      include: {
        course: { select: { id: true, title: true } },
      },
      orderBy: { dueDate: "desc" },
      take: 5,
    }),
  ]);

  const deadlines = [
    ...upcomingAssignments.map((a) => ({
      id: a.id,
      type: "assignment" as const,
      title: a.title,
      dueDate: a.dueDate!.toISOString(),
      courseId: a.courseId,
      courseTitle: a.course.title,
      status: "upcoming" as const,
    })),
    ...upcomingQuizzes.map((q) => ({
      id: q.id,
      type: "quiz" as const,
      title: q.title,
      dueDate: q.dueDate!.toISOString(),
      courseId: q.courseId,
      courseTitle: q.course.title,
      status: "upcoming" as const,
    })),
    ...overdueAssignments.map((a) => ({
      id: a.id,
      type: "assignment" as const,
      title: a.title,
      dueDate: a.dueDate!.toISOString(),
      courseId: a.courseId,
      courseTitle: a.course.title,
      status: "overdue" as const,
    })),
  ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return NextResponse.json({ deadlines });
}
