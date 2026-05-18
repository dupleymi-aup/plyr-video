import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { quizId } = await params;
  const body = await request.json();
  const { answers } = body;

  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "Answers are required" }, { status: 400 });
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true, course: true },
  });
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  // Auto-grade
  let totalScore = 0;
  let maxScore = 0;
  for (const question of quiz.questions) {
    maxScore += question.points;
    const studentAnswer = answers[question.id];
    if (studentAnswer === undefined) continue;

    const correct = question.correctAnswer;
    if (
      question.type === "MULTIPLE_CHOICE" ||
      question.type === "TRUE_FALSE"
    ) {
      if (JSON.stringify(studentAnswer) === JSON.stringify(correct)) {
        totalScore += question.points;
      }
    } else if (question.type === "SHORT_ANSWER") {
      // Simple string comparison for short answers
      if (
        typeof studentAnswer === "string" &&
        typeof correct === "string" &&
        studentAnswer.toLowerCase().trim() === correct.toLowerCase().trim()
      ) {
        totalScore += question.points;
      }
    }
  }

  const passed = totalScore >= maxScore * 0.6; // 60% to pass

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId,
      studentId: session.user.id,
      answers: answers,
      score: totalScore,
      completedAt: new Date(),
      passed,
    },
    include: {
      quiz: { select: { id: true, title: true, maxScore: true } },
      student: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(attempt, { status: 201 });
}
