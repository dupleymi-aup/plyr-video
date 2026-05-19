import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { sendGradeEmail } from "@/lib/email";
import { handleApiError } from "@/lib/api-errors";
import { rateLimit } from "@/lib/rate-limit";

// Max 20 grades per minute per user
const LIMIT = { limit: 20, windowMs: 60 * 1000 };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limit = rateLimit(`grade:${session.user.id}`, LIMIT.limit, LIMIT.windowMs);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many grading requests. Please wait before grading again." },
        { status: 429 }
      );
    }

  const { submissionId } = await params;
  const body = await request.json();
  const { score, feedback } = body;

  if (score == null) {
    return NextResponse.json({ error: "Score is required" }, { status: 400 });
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: { include: { course: true } },
      student: { select: { id: true, name: true, email: true } },
    },
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
      assignment: { select: { id: true, title: true, maxScore: true, courseId: true, course: { select: { id: true, title: true } } } },
      student: { select: { id: true, name: true, email: true } },
    },
  });

  // Create grade notification for student
  const studentPrefs = await prisma.notificationPreference.findUnique({
    where: { userId: submission.studentId },
  });

  if (!studentPrefs || studentPrefs.gradeNotification) {
    await createNotification({
      userId: submission.studentId,
      type: "GRADE_RELEASED",
      content: `Ваше задание "${updated.assignment.title}" оценено: ${updated.score}/${updated.assignment.maxScore}`,
      assignmentId: submission.assignmentId,
      courseId: updated.assignment.course?.id ?? null,
    });

    if (studentPrefs?.emailGrade && submission.student?.email) {
      await sendGradeEmail({
        to: submission.student.email,
        name: submission.student.name || "Студент",
        assignmentTitle: updated.assignment.title,
        score: updated.score!,
        maxScore: updated.assignment.maxScore,
        courseTitle: submission.assignment.course?.title || "",
        feedback: updated.feedback,
      });
    }
  }

  return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "grade");
  }
}
