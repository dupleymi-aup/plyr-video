import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get("teacherId");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (teacherId) where.teacherId = teacherId;
  if (status && status !== "ALL") where.status = status;

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
            assignments: true,
            quizzes: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.course.count({ where }),
  ]);

  return NextResponse.json({
    courses: courses.map((c) => ({
      ...c,
      _count: c._count,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, status } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const course = await prisma.course.create({
    data: {
      title,
      description: description || null,
      status: status || "DRAFT",
      teacherId: session.user.id,
    },
    include: {
      teacher: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(course, { status: 201 });
}
