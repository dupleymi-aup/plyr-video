import { PlyrPlayer } from "@/components/player/plyr-player";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatViews, formatRelativeTime, formatRelativeTimeRu, formatDuration } from "@/lib/utils";
import { ThumbsUp, ThumbsDown, Share2, Plus, Check, PlaySquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import VideoActions from "./video-actions";
import { SubscribeButton } from "@/components/watch/subscribe-button";
import { Comments } from "@/components/watch/comments";
import type { Comment } from "@/types/comment";

interface WatchPageProps {
  params: Promise<{ videoId: string }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { videoId } = await params;
  const session = await auth();

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          slug: true,
          avatar: true,
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
    notFound();
  }

  // Don't show private videos to non-owners
  if (video.visibility === "PRIVATE" || video.status !== "READY") {
    if (!session?.user?.id || video.channel.ownerId !== session.user.id) {
      notFound();
    }
  }

  // Recommended videos (same channel first)
  const recommended = await prisma.video.findMany({
    where: {
      id: { not: videoId },
      channelId: video.channelId,
      status: "READY",
      visibility: "PUBLIC",
    },
    select: {
      id: true,
      title: true,
      thumbnailKey: true,
      poster: true,
      duration: true,
      viewCount: true,
      createdAt: true,
      channel: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 10,
  });

  // If not enough from same channel, get from others
  let moreRecommended: any[] = [];
  if (recommended.length < 5) {
    moreRecommended = await prisma.video.findMany({
      where: {
        id: { not: videoId },
        channelId: { not: video.channelId },
        status: "READY",
        visibility: "PUBLIC",
      },
      select: {
        id: true,
        title: true,
        thumbnailKey: true,
        poster: true,
        duration: true,
        viewCount: true,
        createdAt: true,
        channel: { select: { name: true } },
      },
      orderBy: { viewCount: "desc" },
      take: 10 - recommended.length,
    });
  }

  const allRecommended = [...recommended, ...moreRecommended];

  const isSubscribed = session?.user?.id
    ? await prisma.subscription.findFirst({
        where: {
          subscriberId: session.user.id,
          channelId: video.channelId,
        },
      })
    : null;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Player */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <PlyrPlayer
            source={video.storageKey || video.source || ""}
            poster={video.posterKey || video.poster || undefined}
            className="w-full h-full"
          />
        </div>

        {/* Video info */}
        <div className="mt-4">
          <h1 className="text-xl font-bold">{video.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {formatViews(video.viewCount)} просмотров &middot; {formatRelativeTimeRu(video.publishedAt || video.createdAt)}
            </div>

            <VideoActions
              videoId={video.id}
              channelId={video.channel.id}
              initialLikes={video.likeCount}
              initialDislikes={0}
            />
          </div>
        </div>

        {/* Channel info */}
        <div className="mt-4 flex items-start gap-4 border-b pb-4">
          <Avatar
            src={video.channel.avatar || undefined}
            fallback={video.channel.name[0]}
            size="lg"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/channel/${video.channel.slug}`} className="font-semibold hover:underline">
                {video.channel.name}
              </Link>
              {video.channel.isVerified && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Подтверждён
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatViews(video.channel._count.subscriptions)} подписчиков
            </p>
            <div className="mt-2">
              {!isSubscribed && (
                <SubscribeButton
                  channelId={video.channelId}
                  isSubscribed={!!isSubscribed}
                />
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {video.description && (
          <div className="mt-4 rounded-lg bg-secondary p-4">
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
              {video.description}
            </pre>
          </div>
        )}

        {/* Comments section */}
        <Comments videoId={video.id} />
      </div>

      {/* Sidebar - Recommended videos */}
      <div className="w-full lg:w-80 xl:w-96 shrink-0">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <PlaySquare className="h-5 w-5" />
          Рекомендации
        </h3>
        <div className="space-y-4">
          {allRecommended.map((rec) => (
            <Link key={rec.id} href={`/watch/${rec.id}`} className="flex gap-2 group">
              <div className="relative w-40 aspect-video shrink-0 overflow-hidden rounded-md bg-secondary">
                {rec.thumbnailKey || rec.poster ? (
                  <img
                    src={rec.thumbnailKey || rec.poster}
                    alt={rec.title}
                    className="object-cover w-full h-full transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <PlaySquare className="h-6 w-6" />
                  </div>
                )}
                {rec.duration && (
                  <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white">
                    {formatDuration(rec.duration)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="line-clamp-2 text-sm font-medium group-hover:text-primary">
                  {rec.title}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">{rec.channel?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatViews(rec.viewCount)} views &middot; {formatRelativeTimeRu(rec.createdAt)}
                </p>
              </div>
            </Link>
          ))}
          {allRecommended.length === 0 && (
            <p className="text-sm text-muted-foreground">Нет рекомендаций</p>
          )}
        </div>
      </div>
    </div>
  );
}
