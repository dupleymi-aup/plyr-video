import { VideoGrid } from "@/components/video/video-grid";
import { prisma } from "@/lib/prisma";
import { formatDuration } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function TrendingPage() {
  const videos = await prisma.video.findMany({
    where: {
      status: "READY",
      visibility: "PUBLIC",
    },
    include: {
      channel: {
        select: {
          name: true,
          slug: true,
          avatar: true,
        },
      },
    },
    orderBy: { viewCount: "desc" },
    take: 20,
  });

  if (videos.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">В тренде</h1>
          <p className="text-muted-foreground">Самые популярные видео</p>
        </div>
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          Пока нет видео
        </div>
      </div>
    );
  }

  const mappedVideos = videos.map((video) => ({
    id: video.id,
    title: video.title,
    thumbnail: video.thumbnailKey || "",
    duration: video.duration ? formatDuration(video.duration) : undefined,
    channelName: video.channel?.name || "Неизвестен",
    channelAvatar: video.channel?.avatar || "",
    views: video.viewCount || 0,
    createdAt: video.publishedAt?.toISOString() || video.createdAt.toISOString(),
  }));

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">В тренде</h1>
        <p className="text-muted-foreground">Самые популярные видео</p>
      </div>

      <VideoGrid videos={mappedVideos} columns={3} />
    </div>
  );
}
