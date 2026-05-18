import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assignmentId } = await params;
  const body = await request.json();
  const { content, fileUrl } = body;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: true },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  // Check enrollment
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId: assignment.courseId,
        studentId: session.user.id,
      },
    },
  });
  if (!enrollment && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
  }

  // Check for existing submission (upsert)
  const existing = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId: session.user.id } },
  });

  if (existing) {
    const updated = await prisma.submission.update({
      where: { assignmentId_studentId: { assignmentId, studentId: session.user.id } },
      data: {
        ...(content !== undefined && { content }),
        ...(fileUrl !== undefined && { fileUrl }),
      },
      include: {
        assignment: { select: { id: true, title: true, maxScore: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json(updated);
  }

  const submission = await prisma.submission.create({
    data: {
      assignmentId,
      studentId: session.user.id,
      content: content || null,
      fileUrl: fileUrl || null,
    },
    include: {
      assignment: { select: { id: true, title: true, maxScore: true } },
      student: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(submission, { status: 201 });
}
