import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const session = await auth();
  const { videoId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ liked: false });
  }

  const liked = await prisma.likedVideo.findUnique({
    where: { userId_videoId: { userId: session.user.id, videoId } },
  });

  return NextResponse.json({ liked: !!liked });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { videoId } = await params;

  try {
    await prisma.likedVideo.create({
      data: { userId: session.user.id, videoId },
    });

    await prisma.video.update({
      where: { id: videoId },
      data: { likeCount: { increment: 1 } },
    });

    return NextResponse.json({ liked: true });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Already liked" }, { status: 400 });
    }
    throw error;
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { videoId } = await params;

  await prisma.likedVideo.deleteMany({
    where: { userId: session.user.id, videoId },
  });

  await prisma.video.update({
    where: { id: videoId },
    data: { likeCount: { decrement: 1 } },
  });

  return NextResponse.json({ liked: false });
}
