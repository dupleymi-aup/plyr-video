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

interface VideoListProps {
  videos: Video[];
}

export function VideoList({ videos }: VideoListProps) {
  return (
    <div className="space-y-4">
      {videos.map((video) => (
        <div key={video.id} className="flex gap-4">
          <div className="w-40 shrink-0">
            <VideoCard {...video} />
          </div>
          <div className="flex-1 py-2">
            <h3 className="font-medium">{video.title}</h3>
            {video.channelName && (
              <p className="text-sm text-muted-foreground">{video.channelName}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
