import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";
import { quizQuestionSchema } from "@/lib/validation";

async function verifyCourseAccess(
  courseId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return false;
  return course.teacherId === userId || userRole === "ADMIN";
}

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
        course: { select: { id: true, teacherId: true } },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Students can only see questions of published quizzes they're enrolled for
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

    return NextResponse.json(quiz.questions);
  } catch (error) {
    return handleApiError(error, "quiz-questions");
  }
}

export async function POST(
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

    const validation = quizQuestionSchema.safeParse(body);
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

    if (!(await verifyCourseAccess(quiz.courseId, session.user.id, session.user.role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get max position to append the new question
    const lastQuestion = await prisma.quizQuestion.findFirst({
      where: { quizId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const question = await prisma.quizQuestion.create({
      data: {
        quizId,
        question: validation.data.question,
        type: validation.data.type,
        options: validation.data.options || [],
        correctAnswer: validation.data.correctAnswer,
        points: validation.data.points || 1.0,
        position: (lastQuestion?.position ?? -1) + 1,
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    return handleApiError(error, "quiz-questions");
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
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json({ error: "questionId query param is required" }, { status: 400 });
    }

    const body = await request.json();
    const { question, type, options, correctAnswer, points, position } = body;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, courseId: true },
    });
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (!(await verifyCourseAccess(quiz.courseId, session.user.id, session.user.role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.quizQuestion.findUnique({ where: { id: questionId } });
    if (!existing || existing.quizId !== quizId) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const updated = await prisma.quizQuestion.update({
      where: { id: questionId },
      data: {
        ...(question !== undefined && { question }),
        ...(type !== undefined && { type }),
        ...(options !== undefined && { options }),
        ...(correctAnswer !== undefined && { correctAnswer }),
        ...(points !== undefined && { points }),
        ...(position !== undefined && { position }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "quiz-questions");
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
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json({ error: "questionId query param is required" }, { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, courseId: true },
    });
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (!(await verifyCourseAccess(quiz.courseId, session.user.id, session.user.role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.quizQuestion.findUnique({ where: { id: questionId } });
    if (!existing || existing.quizId !== quizId) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    await prisma.quizQuestion.delete({ where: { id: questionId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "quiz-questions");
  }
}
