import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";

// Public endpoint - no auth required
export async function GET(request: Request) {
  try {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const skip = (page - 1) * limit;

  const where = { status: "PUBLISHED" };

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: {
        teacher: { select: { id: true, name: true, image: true } },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
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
    courses,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
  } catch (error) {
    return handleApiError(error, "courses-public");
  }
}
