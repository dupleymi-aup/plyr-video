"use client";

import useSWR from "swr";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Users, Eye, Upload } from "lucide-react";
import { formatViews, formatWatchTime, formatRelativeTimeRu } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function StudioDashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id;

  // Redirect if not authorized (handled client-side)
  const { data: profile } = useSWR(userId ? "/api/users/me" : null, fetcher);

  const channelIds = profile?.channels?.map((ch: { id: string }) => ch.id) || [];

  const { data: videosData } = useSWR(
    channelIds.length > 0 ? `/api/videos?page=1&limit=5` : null,
    fetcher
  );

  // Calculate stats from profile channels
  const totalViews = profile?.channels?.reduce(
    (sum: number, ch: { totalViews: number }) => sum + (ch.totalViews || 0),
    0
  ) || 0;

  const totalSubscribers = profile?.channels?.reduce(
    (sum: number, ch: { _count?: { subscriptions: number } }) => sum + (ch._count?.subscriptions || 0),
    0
  ) || 0;

  const totalVideos = profile?.channels?.reduce(
    (sum: number, ch: { _count?: { videos: number } }) => sum + (ch._count?.videos || 0),
    0
  ) || 0;

  const statCards = [
    { label: "Просмотры", value: formatViews(totalViews), icon: Eye },
    { label: "Подписчики", value: formatViews(totalSubscribers), icon: Users },
    { label: "Видео", value: totalVideos, icon: Video },
    { label: "Время просмотра", value: "—", icon: Upload },
  ];

  // Recent videos from user's channels
  const recentVideos = profile?.channels?.flatMap(
    (ch: { videos?: Array<{ id: string; title: string; viewCount: number; status: string; createdAt: string }> }) =>
      ch.videos || []
  ) || [];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Creator Studio</h1>
        <p className="text-muted-foreground">Управление каналом и контентом</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
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
              <h3 className="font-medium">Загрузить видео</h3>
              <p className="text-sm text-muted-foreground">Добавить новый контент</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/studio/videos">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium">Управление видео</h3>
              <p className="text-sm text-muted-foreground">Редактировать метаданные</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/studio/courses">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium">Управление курсами</h3>
              <p className="text-sm text-muted-foreground">Создание и управление курсами</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Videos */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Последние видео</h2>
        {recentVideos.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p>У вас пока нет видео</p>
              <Link href="/studio/upload" className="text-sm text-primary hover:underline mt-2 inline-block">
                Загрузить первое видео
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentVideos.slice(0, 5).map((video: {
              id: string;
              title: string;
              viewCount: number;
              status: string;
              createdAt: string;
            }) => (
              <div key={video.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <h4 className="font-medium">{video.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatViews(video.viewCount)} просмотров &middot; {formatRelativeTimeRu(video.createdAt)}
                  </p>
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
                  {video.status === "READY" ? "Готово" : video.status === "PROCESSING" ? "Обработка" : video.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
