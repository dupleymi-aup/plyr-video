import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";
import { assignmentSchema } from "@/lib/validation";

async function verifyAccess(
  courseId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return false;
  return course.teacherId === userId || userRole === "ADMIN";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string; assignmentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { courseId, assignmentId } = await params;
    const body = await request.json();

    const validation = assignmentSchema.partial().safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, courseId: true },
    });
    if (!assignment || assignment.courseId !== courseId) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (!(await verifyAccess(courseId, session.user.id, session.user.role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        ...(validation.data.title !== undefined && { title: validation.data.title }),
        ...(validation.data.description !== undefined && { description: validation.data.description }),
        ...(validation.data.dueDate !== undefined && { dueDate: validation.data.dueDate ? new Date(validation.data.dueDate) : null }),
        ...(validation.data.maxScore !== undefined && { maxScore: validation.data.maxScore }),
        ...(validation.data.weight !== undefined && { weight: validation.data.weight }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "assignment");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ courseId: string; assignmentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { courseId, assignmentId } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, courseId: true },
    });
    if (!assignment || assignment.courseId !== courseId) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (!(await verifyAccess(courseId, session.user.id, session.user.role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.assignment.delete({ where: { id: assignmentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "assignment");
  }
}
