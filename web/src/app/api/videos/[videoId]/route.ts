import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  const video = await prisma.video.findUnique({
    where: { id: params.videoId },
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          slug: true,
          avatar: true,
          banner: true,
          isVerified: true,
          _count: {
            select: { subscriptions: true },
          },
        },
      },
      _count: {
        select: { comments: true },
      },
    },
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  // Don't show private videos to non-owners
  if (video.visibility === "PRIVATE") {
    const session = await auth();
    if (!session?.user?.id || video.channel.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }
  }

  return NextResponse.json(video);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const video = await prisma.video.findUnique({
    where: { id: params.videoId },
    include: { channel: true },
  });

  if (!video || video.channel.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const updated = await prisma.video.update({
    where: { id: params.videoId },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.visibility && { visibility: body.visibility }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const video = await prisma.video.findUnique({
    where: { id: params.videoId },
    include: { channel: true },
  });

  if (!video || video.channel.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  await prisma.video.delete({ where: { id: params.videoId } });

  return NextResponse.json({ success: true });
}
