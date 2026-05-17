import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user, session };
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";

  const where = search
    ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            channels: true,
            playlists: true,
            comments: true,
            likedVideos: true,
            viewHistory: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const body = await request.json();
  const { userId, role } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { ...(role && { role }) },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}
