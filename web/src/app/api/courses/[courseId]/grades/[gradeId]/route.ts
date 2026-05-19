import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";
import { gradeSchema } from "@/lib/validation";

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
  { params }: { params: Promise<{ courseId: string; gradeId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { courseId, gradeId } = await params;
    const body = await request.json();

    if (!(await verifyAccess(courseId, session.user.id, session.user.role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const grade = await prisma.grade.findUnique({
      where: { id: gradeId },
      include: { enrollment: { select: { courseId: true } } },
    });
    if (!grade || grade.enrollment.courseId !== courseId) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }

    const updated = await prisma.grade.update({
      where: { id: gradeId },
      data: {
        ...(body.value !== undefined && { value: Number(body.value) }),
        ...(body.scale !== undefined && { scale: body.scale }),
        ...(body.letterGrade !== undefined && { letterGrade: body.letterGrade }),
        ...(body.note !== undefined && { note: body.note }),
      },
      include: {
        student: { select: { id: true, name: true } },
        enrollment: { select: { courseId: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "grade");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ courseId: string; gradeId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { courseId, gradeId } = await params;

    if (!(await verifyAccess(courseId, session.user.id, session.user.role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const grade = await prisma.grade.findUnique({
      where: { id: gradeId },
      include: { enrollment: { select: { courseId: true } } },
    });
    if (!grade || grade.enrollment.courseId !== courseId) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }

    await prisma.grade.delete({ where: { id: gradeId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "grade");
  }
}
