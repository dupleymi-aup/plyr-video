import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { commentSchema } from "@/lib/validation";
import { validateBody } from "@/lib/middleware";
import { z } from "zod";

const commentWithVideoSchema = commentSchema.extend({
  videoId: z.string().min(1, "videoId is required"),
});

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

  const validation = await validateBody(commentWithVideoSchema)(request);
  if (validation.error) return validation.error;

  const { content, videoId, parentId } = validation.data;

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
