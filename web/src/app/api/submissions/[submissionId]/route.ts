import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";

// View a single submission
export async function GET(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { submissionId } = await params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        student: { select: { id: true, name: true, email: true, image: true } },
        assignment: {
          select: {
            id: true,
            title: true,
            description: true,
            maxScore: true,
            dueDate: true,
            course: { select: { id: true, title: true, teacherId: true } },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Students can only view their own submissions
    if (
      session.user.role === "STUDENT" &&
      submission.studentId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Teachers can only view submissions from their courses
    if (
      session.user.role === "TEACHER" &&
      submission.assignment.course.teacherId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isLate = submission.assignment.dueDate
      ? new Date(submission.submittedAt) > submission.assignment.dueDate
      : false;

    return NextResponse.json({ ...submission, isLate });
  } catch (error) {
    return handleApiError(error, "submission");
  }
}
