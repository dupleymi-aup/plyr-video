import { PlyrPlayer } from "@/components/player/plyr-player";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatViews, formatRelativeTime, formatDuration } from "@/lib/utils";
import { ThumbsUp, ThumbsDown, Share2, Plus } from "lucide-react";

// Demo video - will be fetched from API
const demoVideo = {
  id: "1",
  title: "Getting Started with Plyr Video Player",
  description: `Learn how to use Plyr, a simple, accessible, and customizable HTML5 media player. In this video we cover basic setup, configuration options, and how to integrate Plyr into your web applications.

Plyr supports:
- HTML5 Video & Audio
- YouTube
- Vimeo
- Rutube, VK Video, Yandex Cloud Video, and more

Links:
- GitHub: https://github.com/quadDarv1ne/plyr-video
- Demo: https://plyr-video-demo.example.com`,
  source: "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer/View_From_A_Blue_Moon_Trailer-576p.mp4",
  poster: "https://cdn.plyr.io/static/demo/thumbs/View_From_A_Blue_Moon_Trailer-HD.jpg",
  duration: 180,
  views: 15420,
  createdAt: "2024-01-15T10:00:00Z",
  channel: {
    id: "1",
    name: "Plyr Official",
    avatar: "",
    subscribers: 12500,
    isVerified: true,
  },
  likes: 892,
  dislikes: 12,
};

const recommendedVideos = [
  {
    id: "2",
    title: "Advanced Plyr Features",
    thumbnail: "https://cdn.plyr.io/static/demo/thumbs/View_From_A_Blue_Moon_Trailer-HD.jpg",
    duration: 320,
    channelName: "Plyr Official",
    views: 8930,
    createdAt: "2024-02-20T14:30:00Z",
  },
  {
    id: "3",
    title: "Integrating Plyr with React",
    thumbnail: "https://cdn.plyr.io/static/demo/thumbs/View_From_A_Blue_Moon_Trailer-HD.jpg",
    duration: 450,
    channelName: "Web Dev Tutorials",
    views: 23100,
    createdAt: "2024-03-10T09:00:00Z",
  },
  {
    id: "4",
    title: "Russian Video Platforms",
    thumbnail: "https://cdn.plyr.io/static/demo/thumbs/View_From_A_Blue_Moon_Trailer-HD.jpg",
    duration: 600,
    channelName: "Plyr Official",
    views: 5200,
    createdAt: "2024-04-05T16:00:00Z",
  },
];

export default function WatchPage({ params }: { params: { videoId: string } }) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Player */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <PlyrPlayer
            source={demoVideo.source}
            poster={demoVideo.poster}
            className="w-full h-full"
          />
        </div>

        {/* Video info */}
        <div className="mt-4">
          <h1 className="text-xl font-bold">{demoVideo.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {formatViews(demoVideo.views)} views • {formatRelativeTime(demoVideo.createdAt)}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <ThumbsUp className="h-4 w-4 mr-1" />
                {demoVideo.likes}
              </Button>
              <Button variant="outline" size="sm">
                <ThumbsDown className="h-4 w-4 mr-1" />
                {demoVideo.dislikes}
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Channel info */}
        <div className="mt-4 flex items-start gap-4 border-b pb-4">
          <Avatar
            src={demoVideo.channel.avatar}
            fallback={demoVideo.channel.name[0]}
            size="lg"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{demoVideo.channel.name}</h3>
              {demoVideo.channel.isVerified && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatViews(demoVideo.channel.subscribers)} subscribers
            </p>
            <Button className="mt-2" size="sm">
              Subscribe
            </Button>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 rounded-lg bg-secondary p-4">
          <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
            {demoVideo.description}
          </pre>
        </div>

        {/* Comments section placeholder */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Comments</h3>
          <p className="text-muted-foreground">Comments will be implemented in the next phase.</p>
        </div>
      </div>

      {/* Sidebar - Recommended videos */}
      <div className="w-full lg:w-80 xl:w-96 shrink-0">
        <h3 className="text-lg font-semibold mb-4">Recommended</h3>
        <div className="space-y-4">
          {recommendedVideos.map((video) => (
            <a key={video.id} href={`/watch/${video.id}`} className="flex gap-2 group">
              <div className="relative w-40 aspect-video shrink-0 overflow-hidden rounded-md bg-secondary">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="object-cover w-full h-full transition-transform group-hover:scale-105"
                />
                {video.duration && (
                  <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white">
                    {formatDuration(video.duration)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="line-clamp-2 text-sm font-medium group-hover:text-primary">
                  {video.title}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">{video.channelName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatViews(video.views)} views • {formatRelativeTime(video.createdAt)}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
