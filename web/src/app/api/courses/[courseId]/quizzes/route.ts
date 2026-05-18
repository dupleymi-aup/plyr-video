import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;

  const quizzes = await prisma.quiz.findMany({
    where: { courseId },
    include: {
      _count: { select: { attempts: true, questions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(quizzes);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { courseId } = await params;
  const body = await request.json();
  const { title, description, timeLimit, maxScore, weight, questions } = body;

  if (!title || maxScore == null) {
    return NextResponse.json({ error: "Title and maxScore are required" }, { status: 400 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (course.teacherId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const quiz = await prisma.quiz.create({
    data: {
      title,
      description: description || null,
      timeLimit: timeLimit || null,
      maxScore: Number(maxScore),
      weight: Number(weight) || 1.0,
      courseId,
      ...(questions && questions.length > 0
        ? {
            questions: {
              create: questions.map((q: any, i: number) => ({
                question: q.question,
                type: q.type || "MULTIPLE_CHOICE",
                options: q.options || [],
                correctAnswer: q.correctAnswer,
                points: q.points || 1.0,
                position: i,
              })),
            },
          }
        : {}),
    },
    include: { questions: true },
  });

  return NextResponse.json(quiz, { status: 201 });
}
