import { VideoGrid } from "@/components/video/video-grid";
import { prisma } from "@/lib/prisma";
import { formatDuration } from "@/lib/utils";
import { useTranslations } from "next-intl";

export default async function HomePage() {
  const t = useTranslations("home");

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

  const mappedVideos = videos.map((video) => ({
    id: video.id,
    title: video.title,
    thumbnail: video.thumbnailKey || "",
    duration: video.duration ? formatDuration(video.duration) : undefined,
    channelName: video.channel?.name || "Unknown",
    channelAvatar: video.channel?.avatar || "",
    views: video.viewCount || 0,
    createdAt: video.publishedAt?.toISOString() || video.createdAt.toISOString(),
  }));

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {mappedVideos.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          {t("noVideos")}
        </div>
      ) : (
        <VideoGrid videos={mappedVideos} columns={3} />
      )}
    </div>
  );
}
