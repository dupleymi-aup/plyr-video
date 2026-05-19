import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";

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

    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      include: {
        video: { select: { id: true, title: true, duration: true } },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    return handleApiError(error, "course-lessons-GET");
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { courseId } = await params;
    const body = await request.json();
    const { title, description, position, lessonType, videoId, duration } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    if (course.teacherId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const maxPos =
      position ??
      ((await prisma.lesson.aggregate({
        where: { courseId },
        _max: { position: true },
      }))._max.position ?? 0) + 1;

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description: description || null,
        position: maxPos,
        lessonType: lessonType || "VIDEO",
        videoId: videoId || null,
        duration: duration || null,
        courseId,
      },
      include: {
        video: { select: { id: true, title: true, duration: true } },
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    return handleApiError(error, "course-lessons-POST");
  }
}
