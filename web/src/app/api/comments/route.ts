import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { commentSchema } from "@/lib/validation";
import { validateBody } from "@/lib/middleware";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const commentWithVideoSchema = commentSchema.extend({
  videoId: z.string().min(1, "videoId is required"),
});

// Max 10 comments per minute per user
const COMMENT_LIMIT = { limit: 10, windowMs: 60 * 1000 };

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const videoId = searchParams.get("videoId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where = { parentId: null, ...(videoId ? { videoId } : {}) };

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

  // Rate limit per user
  const limit = rateLimit(`comment:${session.user.id}`, COMMENT_LIMIT.limit, COMMENT_LIMIT.windowMs);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many comments. Please wait before posting again." },
      { status: 429 }
    );
  }

  const validation = await validateBody(commentWithVideoSchema)(request);
  if (validation.error) return validation.error;

  const { content, videoId, parentId } = validation.data;

  // If replying to a comment, verify the parent belongs to the same video
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { videoId: true },
    });

    if (!parentComment || parentComment.videoId !== videoId) {
      return NextResponse.json(
        { error: "Parent comment not found or does not belong to this video" },
        { status: 400 }
      );
    }
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
