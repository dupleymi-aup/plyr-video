import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";

// Get course progress for current user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const [totalLessons, completedLessons] = await Promise.all([
      prisma.lesson.count({ where: { courseId } }),
      prisma.lessonCompletion.count({
        where: {
          lesson: { courseId },
          studentId: session.user.id,
        },
      }),
    ]);

    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      select: {
        id: true,
        title: true,
        lessonType: true,
        position: true,
      },
      orderBy: { position: "asc" },
    });

    const completedIds = new Set(
      (
        await prisma.lessonCompletion.findMany({
          where: {
            lesson: { courseId },
            studentId: session.user.id,
          },
          select: { lessonId: true },
        })
      ).map((c) => c.lessonId)
    );

    return NextResponse.json({
      totalLessons,
      completedLessons,
      progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      lessons: lessons.map((l) => ({
        ...l,
        completed: completedIds.has(l.id),
      })),
    });
  } catch (error) {
    return handleApiError(error, "lesson-progress");
  }
}
