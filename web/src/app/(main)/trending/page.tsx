import { VideoGrid } from "@/components/video/video-grid";

const trendingVideos = [
  {
    id: "1",
    title: "Most Popular Video of the Month",
    thumbnail: "https://cdn.plyr.io/static/demo/thumbs/View_From_A_Blue_Moon_Trailer-HD.jpg",
    duration: 240,
    channelName: "Trending Channel",
    views: 1520000,
    createdAt: "2024-06-01T10:00:00Z",
  },
  {
    id: "2",
    title: "Breaking News: Latest Tech Updates",
    thumbnail: "https://cdn.plyr.io/static/demo/thumbs/View_From_A_Blue_Moon_Trailer-HD.jpg",
    duration: 180,
    channelName: "Tech News",
    views: 892000,
    createdAt: "2024-06-10T14:00:00Z",
  },
  {
    id: "3",
    title: "Epic Gameplay Highlights",
    thumbnail: "https://cdn.plyr.io/static/demo/thumbs/View_From_A_Blue_Moon_Trailer-HD.jpg",
    duration: 600,
    channelName: "Gaming Pro",
    views: 654000,
    createdAt: "2024-06-12T09:00:00Z",
  },
];

export default function TrendingPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Trending</h1>
        <p className="text-muted-foreground">The most popular videos right now</p>
      </div>

      <VideoGrid videos={trendingVideos} columns={3} />
    </div>
  );
}
