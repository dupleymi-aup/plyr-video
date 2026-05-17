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
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      include: {
        channel: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.video.count({ where }),
  ]);

  return NextResponse.json({
    videos,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const body = await request.json();
  const { videoId } = body;

  if (!videoId) {
    return NextResponse.json({ error: "videoId is required" }, { status: 400 });
  }

  await prisma.video.update({
    where: { id: videoId },
    data: { status: "DELETED" },
  });

  return NextResponse.json({ success: true });
}
