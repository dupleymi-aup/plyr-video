import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VideoGrid } from "@/components/video/video-grid";
import { formatViews } from "@/lib/utils";

const demoChannel = {
  id: "1",
  name: "Plyr Official",
  slug: "plyr-official",
  description: "Official channel for Plyr video player tutorials and updates.",
  avatar: "",
  banner: "",
  isVerified: true,
  subscribers: 12500,
  videos: [
    {
      id: "1",
      title: "Getting Started with Plyr",
      thumbnail: "https://cdn.plyr.io/static/demo/thumbs/View_From_A_Blue_Moon_Trailer-HD.jpg",
      duration: 180,
      views: 15420,
      createdAt: "2024-01-15T10:00:00Z",
    },
    {
      id: "2",
      title: "Advanced Plyr Features",
      thumbnail: "https://cdn.plyr.io/static/demo/thumbs/View_From_A_Blue_Moon_Trailer-HD.jpg",
      duration: 320,
      views: 8930,
      createdAt: "2024-02-20T14:30:00Z",
    },
  ],
};

export default function ChannelPage({ params }: { params: { channelId: string } }) {
  return (
    <div>
      {/* Banner */}
      <div className="h-32 sm:h-48 bg-gradient-to-r from-primary/20 to-primary/40" />

      <div className="p-6">
        {/* Channel header */}
        <div className="flex flex-col sm:flex-row items-start gap-4 -mt-12">
          <Avatar
            src={demoChannel.avatar}
            fallback={demoChannel.name[0]}
            size="lg"
            className="h-24 w-24 border-4 border-background"
          />
          <div className="flex-1 mt-12 sm:mt-14">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{demoChannel.name}</h1>
              {demoChannel.isVerified && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Verified
                </span>
              )}
            </div>
            <p className="text-muted-foreground">
              {formatViews(demoChannel.subscribers)} subscribers • {demoChannel.videos.length} videos
            </p>
            <p className="mt-2 text-sm">{demoChannel.description}</p>
            <Button className="mt-3">Subscribe</Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b">
          <div className="flex gap-6">
            <button className="border-b-2 border-primary pb-3 text-sm font-medium">
              Videos
            </button>
            <button className="pb-3 text-sm text-muted-foreground hover:text-foreground">
              Playlists
            </button>
            <button className="pb-3 text-sm text-muted-foreground hover:text-foreground">
              About
            </button>
          </div>
        </div>

        {/* Videos grid */}
        <div className="mt-6">
          <VideoGrid videos={demoChannel.videos} columns={3} />
        </div>
      </div>
    </div>
  );
}
