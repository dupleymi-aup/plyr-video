import { VideoGrid } from "@/components/video/video-grid";
import { prisma } from "@/lib/prisma";
import { formatDuration } from "@/lib/utils";

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
          slug: true,
          avatar: true,
        },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  const mappedVideos = videos.map((v) => ({
    id: v.id,
    title: v.title,
    thumbnail: v.poster || undefined,
    duration: v.duration ? formatDuration(v.duration) : undefined,
    channelName: v.channel?.name || undefined,
    channelAvatar: v.channel?.avatar || undefined,
    views: v.viewCount,
    createdAt: v.createdAt.toISOString(),
  }));

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Home</h1>
        <p className="text-muted-foreground">Discover the latest videos</p>
      </div>

      {mappedVideos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No videos available.</p>
      ) : (
        <VideoGrid videos={mappedVideos} columns={3} />
      )}
    </div>
  );
}
