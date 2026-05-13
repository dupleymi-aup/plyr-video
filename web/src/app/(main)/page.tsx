import { VideoGrid } from "@/components/video/video-grid";

// Demo data - will be replaced with API calls
const demoVideos = [
  {
    id: "1",
    title: "Getting Started with Plyr Video Player",
    thumbnail: "https://cdn.plyr.io/static/demo/thumbs/View_From_A_Blue_Moon_Trailer-HD.jpg",
    duration: 180,
    channelName: "Plyr Official",
    channelAvatar: "",
    views: 15420,
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    title: "Advanced Plyr Features: Captions, Quality, and More",
    thumbnail: "https://cdn.plyr.io/static/demo/thumbs/View_From_A_Blue_Moon_Trailer-HD.jpg",
    duration: 320,
    channelName: "Plyr Official",
    channelAvatar: "",
    views: 8930,
    createdAt: "2024-02-20T14:30:00Z",
  },
  {
    id: "3",
    title: "Integrating Plyr with React and Next.js",
    thumbnail: "https://cdn.plyr.io/static/demo/thumbs/View_From_A_Blue_Moon_Trailer-HD.jpg",
    duration: 450,
    channelName: "Web Dev Tutorials",
    channelAvatar: "",
    views: 23100,
    createdAt: "2024-03-10T09:00:00Z",
  },
  {
    id: "4",
    title: "Russian Video Platforms: Rutube, VK, Yandex Integration",
    thumbnail: "https://cdn.plyr.io/static/demo/thumbs/View_From_A_Blue_Moon_Trailer-HD.jpg",
    duration: 600,
    channelName: "Plyr Official",
    channelAvatar: "",
    views: 5200,
    createdAt: "2024-04-05T16:00:00Z",
  },
  {
    id: "5",
    title: "Building a Video Platform from Scratch",
    thumbnail: "https://cdn.plyr.io/static/demo/thumbs/View_From_A_Blue_Moon_Trailer-HD.jpg",
    duration: 900,
    channelName: "Full Stack Dev",
    channelAvatar: "",
    views: 41200,
    createdAt: "2024-05-12T11:00:00Z",
  },
  {
    id: "6",
    title: "Video Streaming with HLS and DASH",
    thumbnail: "https://cdn.plyr.io/static/demo/thumbs/View_From_A_Blue_Moon_Trailer-HD.jpg",
    duration: 720,
    channelName: "Streaming Pro",
    channelAvatar: "",
    views: 12800,
    createdAt: "2024-06-18T08:00:00Z",
  },
];

export default function HomePage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Home</h1>
        <p className="text-muted-foreground">Discover the latest videos</p>
      </div>

      <VideoGrid videos={demoVideos} columns={3} />
    </div>
  );
}
