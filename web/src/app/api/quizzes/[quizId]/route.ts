import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";
import { quizSchema } from "@/lib/validation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: { orderBy: { position: "asc" } },
        course: { select: { id: true, title: true, teacherId: true } },
        _count: { select: { attempts: true } },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Students can only access quizzes from courses they're enrolled in
    if (session.user.role === "STUDENT") {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId: quiz.courseId,
            studentId: session.user.id,
          },
        },
      });
      if (!enrollment) {
        return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
      }
    }

    return NextResponse.json(quiz);
  } catch (error) {
    return handleApiError(error, "quiz");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { quizId } = await params;
    const body = await request.json();

    const validation = quizSchema.partial().safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, courseId: true },
    });
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const course = await prisma.course.findUnique({ where: { id: quiz.courseId } });
    if (!course || (course.teacherId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        ...(validation.data.title !== undefined && { title: validation.data.title }),
        ...(validation.data.description !== undefined && { description: validation.data.description }),
        ...(validation.data.timeLimit !== undefined && { timeLimit: validation.data.timeLimit }),
        ...(validation.data.maxScore !== undefined && { maxScore: validation.data.maxScore }),
        ...(validation.data.weight !== undefined && { weight: validation.data.weight }),
        ...(validation.data.dueDate !== undefined && { dueDate: validation.data.dueDate ? new Date(validation.data.dueDate) : null }),
      },
      include: {
        questions: { orderBy: { position: "asc" } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "quiz");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { quizId } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, courseId: true },
    });
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const course = await prisma.course.findUnique({ where: { id: quiz.courseId } });
    if (!course || (course.teacherId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.quiz.delete({ where: { id: quizId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "quiz");
  }
}
