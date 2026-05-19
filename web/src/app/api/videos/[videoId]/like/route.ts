import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await auth();
    const { videoId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ liked: false });
    }

    const liked = await prisma.likedVideo.findUnique({
      where: { userId_videoId: { userId: session.user.id, videoId } },
    });

    return NextResponse.json({ liked: !!liked });
  } catch (error) {
    return handleApiError(error, "video-like-GET");
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId } = await params;

    await prisma.likedVideo.create({
      data: { userId: session.user.id, videoId },
    });

    await prisma.video.update({
      where: { id: videoId },
      data: { likeCount: { increment: 1 } },
    });

    return NextResponse.json({ liked: true });
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Already liked" }, { status: 400 });
    }
    return handleApiError(error, "video-like-POST");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
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
  } catch (error) {
    return handleApiError(error, "video-like-DELETE");
  }
}
