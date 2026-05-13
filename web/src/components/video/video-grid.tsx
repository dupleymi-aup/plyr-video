import { VideoCard } from "./video-card";

interface Video {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  channelName?: string;
  channelAvatar?: string;
  views?: number;
  createdAt?: string;
}

interface VideoGridProps {
  videos: Video[];
  columns?: 1 | 2 | 3 | 4;
}

export function VideoGrid({ videos, columns = 3 }: VideoGridProps) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={`grid gap-6 ${gridClasses[columns]}`}>
      {videos.map((video) => (
        <VideoCard key={video.id} {...video} />
      ))}
    </div>
  );
}
