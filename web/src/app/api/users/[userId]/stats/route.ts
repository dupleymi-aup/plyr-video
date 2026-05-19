import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      channels: {
        include: {
          _count: {
            select: {
              videos: true,
              subscriptions: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const channelIds = user.channels.map((ch) => ch.id);

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
    ...user,
    passwordHash: undefined,
    twoFactorSecret: undefined,
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
