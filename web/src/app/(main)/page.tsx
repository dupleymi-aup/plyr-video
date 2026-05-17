import { prisma } from "@/lib/prisma";
import { VideoGrid } from "@/components/video/video-grid";

export default async function HomePage() {
  const videos = await prisma.video.findMany({
    where: {
      status: "READY",
      visibility: "PUBLIC",
    },
    include: {
      channel: {
        select: {
          name: true,
          avatar: true,
          slug: true,
        },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  const formattedVideos = videos.map((video) => ({
    id: video.id,
    title: video.title,
    thumbnail: video.thumbnailKey || "",
    duration: video.duration || 0,
    channelName: video.channel?.name || "Unknown",
    channelAvatar: video.channel?.avatar || "",
    views: video.viewCount || 0,
    createdAt: video.publishedAt?.toISOString() || video.createdAt.toISOString(),
  }));

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Главная</h1>
        <p className="text-muted-foreground">Последние видео</p>
      </div>

      {formattedVideos.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          Пока нет видео
        </div>
      ) : (
        <VideoGrid videos={formattedVideos} columns={3} />
      )}
    </div>
  );
}
