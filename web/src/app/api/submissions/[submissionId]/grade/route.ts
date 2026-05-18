import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { submissionId } = await params;
  const body = await request.json();
  const { score, feedback } = body;

  if (score == null) {
    return NextResponse.json({ error: "Score is required" }, { status: 400 });
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { assignment: { include: { course: true } } },
  });
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  // Only teacher of the course or admin can grade
  if (
    submission.assignment.course.teacherId !== session.user.id &&
    session.user.role !== "ADMIN"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      score: Number(score),
      feedback: feedback || null,
      gradedAt: new Date(),
    },
    include: {
      assignment: { select: { id: true, title: true, maxScore: true } },
      student: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(updated);
}
