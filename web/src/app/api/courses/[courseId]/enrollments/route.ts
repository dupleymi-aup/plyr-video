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

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { courseId },
    include: {
      student: { select: { id: true, name: true, email: true } },
      _count: {
        select: { grades: true },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  return NextResponse.json(enrollments);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;
  const body = await request.json();
  const { studentId } = body;

  // Verify course exists
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // ADMIN can enroll anyone, TEACHER can enroll in their own courses, STUDENT can self-enroll
  if (session.user.role === "STUDENT") {
    // Self-enrollment
    const targetId = session.user.id;
    const existing = await prisma.courseEnrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId: targetId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    }
    const enrollment = await prisma.courseEnrollment.create({
      data: { courseId, studentId: targetId },
      include: { student: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json(enrollment, { status: 201 });
  }

  if (session.user.role === "TEACHER" && course.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!studentId) {
    return NextResponse.json({ error: "studentId is required" }, { status: 400 });
  }

  const existing = await prisma.courseEnrollment.findUnique({
    where: { courseId_studentId: { courseId, studentId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
  }

  const enrollment = await prisma.courseEnrollment.create({
    data: { courseId, studentId },
    include: { student: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(enrollment, { status: 201 });
}
