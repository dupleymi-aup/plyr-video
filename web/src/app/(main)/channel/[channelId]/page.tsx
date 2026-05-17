import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VideoGrid } from "@/components/video/video-grid";
import { formatViews, formatDateRu } from "@/lib/utils";
import { ChannelSubscribe } from "@/components/watch/subscribe-button";
import { Check, Video, Users, PlaySquare } from "lucide-react";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;

  // Try to find channel by slug first, then by id
  let channel = await prisma.channel.findUnique({
    where: { slug: channelId },
    include: {
      videos: {
        where: { status: "READY", visibility: "PUBLIC" },
        orderBy: { publishedAt: "desc" },
        take: 20,
      },
      _count: {
        select: {
          videos: { where: { status: "READY", visibility: "PUBLIC" } },
          subscriptions: true,
        },
      },
    },
  });

  if (!channel) {
    channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        videos: {
          where: { status: "READY", visibility: "PUBLIC" },
          orderBy: { publishedAt: "desc" },
          take: 20,
        },
        _count: {
          select: {
            videos: { where: { status: "READY", visibility: "PUBLIC" } },
            subscriptions: true,
          },
        },
      },
    });
  }

  if (!channel) notFound();

  const formattedVideos = channel.videos.map((video) => ({
    id: video.id,
    title: video.title,
    thumbnail: video.thumbnailKey || "",
    duration: video.duration || 0,
    channelName: channel.name,
    channelAvatar: channel.avatar || "",
    views: video.viewCount || 0,
    createdAt: video.publishedAt?.toISOString() || video.createdAt.toISOString(),
  }));

  return (
    <div>
      {/* Banner */}
      <div className="h-32 sm:h-48 bg-gradient-to-r from-primary/20 to-primary/40" />

      <div className="p-6">
        {/* Channel header */}
        <div className="flex flex-col sm:flex-row items-start gap-4 -mt-12">
          <Avatar
            src={channel.avatar || undefined}
            fallback={channel.name[0]}
            size="lg"
            className="h-24 w-24 border-4 border-background"
          />
          <div className="flex-1 mt-12 sm:mt-14">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{channel.name}</h1>
              {channel.isVerified && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Верифицирован
                </span>
              )}
            </div>
            <p className="text-muted-foreground">
              {formatViews(channel._count.subscriptions)} подписчиков &middot; {channel._count.videos} видео
            </p>
            {channel.description && (
              <p className="mt-2 text-sm">{channel.description}</p>
            )}
            <div className="mt-3">
              <ChannelSubscribe channelId={channel.id} initialSubscribers={channel._count.subscriptions} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b">
          <div className="flex gap-6">
            <button className="border-b-2 border-primary pb-3 text-sm font-medium flex items-center gap-1">
              <Video className="h-4 w-4" />
              Видео
            </button>
            <button className="pb-3 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <PlaySquare className="h-4 w-4" />
              Плейлисты
            </button>
            <button className="pb-3 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Users className="h-4 w-4" />
              О канале
            </button>
          </div>
        </div>

        {/* Videos grid */}
        <div className="mt-6">
          {formattedVideos.length === 0 ? (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">
              Пока нет видео
            </div>
          ) : (
            <VideoGrid videos={formattedVideos} columns={3} />
          )}
        </div>
      </div>
    </div>
  );
}
