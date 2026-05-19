import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Users can only view their own stats unless they're admin
  const isAdmin = session.user.role === "ADMIN";
  if (userId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [user, channels] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        bio: true,
        location: true,
        website: true,
        theme: true,
        language: true,
        banned: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.channel.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            videos: true,
            subscriptions: true,
          },
        },
      },
    }),
  ]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const channelIds = channels.map((ch) => ch.id);

  const [
    totalViews,
    watchTime,
    likedVideosCount,
    commentsCount,
    subscriptionsCount,
    recentViews,
  ] = await Promise.all([
    prisma.video.aggregate({
      where: { channelId: { in: channelIds } },
      _sum: { viewCount: true },
    }),
    prisma.videoView.aggregate({
      where: { userId },
      _sum: { watchedSeconds: true },
    }),
    prisma.likedVideo.count({ where: { userId } }),
    prisma.comment.count({ where: { userId } }),
    prisma.subscription.count({ where: { subscriberId: userId } }),
    prisma.videoView.findMany({
      where: { userId },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailKey: true,
            duration: true,
            channel: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    user,
    channels,
    stats: {
      totalViews: totalViews._sum.viewCount || 0,
      totalWatchTimeSeconds: watchTime._sum.watchedSeconds || 0,
      likedVideosCount,
      commentsCount,
      subscriptionsCount,
    },
    recentViews,
  });
}
