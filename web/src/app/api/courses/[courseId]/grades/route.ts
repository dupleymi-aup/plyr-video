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

  // Verify course exists
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Only course owner (teacher) or admin can view grades
  if (session.user.role !== "ADMIN" && course.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const grades = await prisma.grade.findMany({
    where: { enrollment: { courseId } },
    include: {
      enrollment: {
        include: {
          student: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(grades);
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
  const { studentId, value, scale, letterGrade, note } = body;

  if (studentId == null || value == null) {
    return NextResponse.json({ error: "studentId and value are required" }, { status: 400 });
  }

  const numericValue = Number(value);
  if (isNaN(numericValue)) {
    return NextResponse.json({ error: "Grade value must be a number" }, { status: 400 });
  }

  const scale = body.scale || "PERCENT";
  const scaleLimits: Record<string, { min: number; max: number }> = {
    PERCENT: { min: 0, max: 100 },
    POINTS: { min: 0, max: 1000 },
    LETTER: { min: 0, max: 4 },
  };
  const limits = scaleLimits[scale];
  if (limits && (numericValue < limits.min || numericValue > limits.max)) {
    return NextResponse.json(
      { error: `Grade value must be between ${limits.min} and ${limits.max} for ${scale} scale` },
      { status: 400 }
    );
  }

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { courseId_studentId: { courseId, studentId } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "Student not enrolled in this course" }, { status: 404 });
  }

  const grade = await prisma.grade.create({
    data: {
      enrollmentId: enrollment.id,
      studentId,
      value: numericValue,
      scale,
      letterGrade: body.letterGrade || null,
      note: body.note || null,
    },
    include: {
      enrollment: {
        include: {
          student: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  return NextResponse.json(grade, { status: 201 });
}
