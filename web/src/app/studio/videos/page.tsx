import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Eye, ThumbsUp, MessageSquare } from "lucide-react";

const videos = [
  {
    id: "1",
    title: "Getting Started with Plyr",
    views: 15420,
    likes: 892,
    comments: 45,
    status: "READY",
    visibility: "PUBLIC",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    title: "Advanced Plyr Features",
    views: 8930,
    likes: 421,
    comments: 23,
    status: "READY",
    visibility: "PUBLIC",
    createdAt: "2024-02-20",
  },
];

export default function StudioVideosPage() {
  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Videos</h1>
          <p className="text-muted-foreground">Manage your uploaded videos</p>
        </div>
        <Button>Upload New</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="border-b bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Video</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Visibility</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Views</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Likes</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Comments</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video.id} className="border-b last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-20 rounded bg-secondary flex items-center justify-center">
                        <Video className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{video.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        video.status === "READY"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {video.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{video.visibility}</td>
                  <td className="px-4 py-3 text-right text-sm">{video.views}</td>
                  <td className="px-4 py-3 text-right text-sm">{video.likes}</td>
                  <td className="px-4 py-3 text-right text-sm">{video.comments}</td>
                  <td className="px-4 py-3 text-right text-sm">{video.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
