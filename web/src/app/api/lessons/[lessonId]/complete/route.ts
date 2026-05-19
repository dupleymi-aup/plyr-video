import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";

// Mark lesson as complete
export async function POST(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, courseId: true },
    });
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: lesson.courseId,
          studentId: session.user.id,
        },
      },
    });
    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
    }

    // Upsert: if already completed, just return
    const completion = await prisma.lessonCompletion.upsert({
      where: {
        lessonId_studentId: {
          lessonId,
          studentId: session.user.id,
        },
      },
      create: {
        lessonId,
        studentId: session.user.id,
      },
      update: {},
    });

    return NextResponse.json(completion, { status: 201 });
  } catch (error) {
    return handleApiError(error, "lesson-complete");
  }
}

// Unmark lesson completion
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId } = await params;

    await prisma.lessonCompletion.deleteMany({
      where: {
        lessonId,
        studentId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "lesson-complete");
  }
}

// Check if lesson is completed by current user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId } = await params;

    const completion = await prisma.lessonCompletion.findUnique({
      where: {
        lessonId_studentId: {
          lessonId,
          studentId: session.user.id,
        },
      },
    });

    return NextResponse.json({ completed: !!completion });
  } catch (error) {
    return handleApiError(error, "lesson-complete");
  }
}
