import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";

// List all submissions for an assignment (teachers only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assignmentId } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: { select: { id: true, teacherId: true } } },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Only teacher or admin can view submissions
    if (assignment.course.teacherId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const submissions = await prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: { select: { id: true, name: true, email: true, image: true } },
        assignment: { select: { id: true, title: true, maxScore: true, dueDate: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    // Flag late submissions
    const withLateStatus = submissions.map((s) => ({
      ...s,
      isLate: assignment.dueDate ? new Date(s.submittedAt) > assignment.dueDate : false,
    }));

    return NextResponse.json(withLateStatus);
  } catch (error) {
    return handleApiError(error, "submissions");
  }
}
