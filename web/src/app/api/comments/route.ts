import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const videoId = searchParams.get("videoId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: any = { parentId: null };
  if (videoId) where.videoId = videoId;

  const comments = await prisma.comment.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, image: true } },
      replies: {
        take: 3,
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      _count: { select: { replies: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  return NextResponse.json(comments);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content, videoId, parentId } = body;

  if (!content || !videoId) {
    return NextResponse.json(
      { error: "Content and videoId are required" },
      { status: 400 }
    );
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      videoId,
      userId: session.user.id,
      parentId: parentId || null,
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  // Update video comment count
  await prisma.video.update({
    where: { id: videoId },
    data: { commentCount: { increment: 1 } },
  });

  return NextResponse.json(comment, { status: 201 });
}
