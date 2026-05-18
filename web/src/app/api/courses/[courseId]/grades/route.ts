import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { courseId } = await params;

  const grades = await prisma.grade.findMany({
    where: { enrollment: { courseId } },
    include: {
      enrollment: {
        include: {
          student: { select: { id: true, name: true, email: true } },
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
      value: Number(value),
      scale: scale || "PERCENT",
      letterGrade: letterGrade || null,
      note: note || null,
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
