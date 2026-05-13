import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Users, Eye, Upload } from "lucide-react";

const stats = [
  { label: "Total Views", value: "12.4K", icon: Eye, change: "+12%" },
  { label: "Subscribers", value: "892", icon: Users, change: "+5%" },
  { label: "Videos", value: "24", icon: Video, change: "+2" },
  { label: "Watch Time", value: "156h", icon: Upload, change: "+18%" },
];

const recentVideos = [
  { id: "1", title: "Getting Started with Plyr", views: 15420, status: "READY" },
  { id: "2", title: "Advanced Plyr Features", views: 8930, status: "READY" },
  { id: "3", title: "Processing Video...", views: 0, status: "PROCESSING" },
];

export default function StudioDashboard() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Creator Studio</h1>
        <p className="text-muted-foreground">Manage your channel and content</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground text-green-600">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link href="/studio/upload">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium">Upload Video</h3>
              <p className="text-sm text-muted-foreground">Add new content to your channel</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/studio/videos">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium">Manage Videos</h3>
              <p className="text-sm text-muted-foreground">Edit metadata and settings</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/studio/settings">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium">Channel Settings</h3>
              <p className="text-sm text-muted-foreground">Customize your channel</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent videos */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Recent Videos</h2>
        <div className="space-y-2">
          {recentVideos.map((video) => (
            <div key={video.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <h4 className="font-medium">{video.title}</h4>
                <p className="text-sm text-muted-foreground">{video.views} views</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  video.status === "READY"
                    ? "bg-green-100 text-green-700"
                    : video.status === "PROCESSING"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {video.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
