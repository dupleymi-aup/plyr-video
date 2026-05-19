"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Eye, Clock, Heart, MessageSquare, Users, PlaySquare, Video, ArrowLeft } from "lucide-react";
import { formatViews, formatWatchTime, formatDuration, formatRelativeTimeRu, formatDateRu } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
});

export default function UserStatsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: stats, isLoading } = useSWR(
    userId ? `/api/users/${userId}/stats` : null,
    fetcher
  );

  if (!userId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Войдите для просмотра статистики</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-8 w-24 animate-pulse rounded bg-secondary" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: "Просмотры каналов", value: formatViews(stats.stats?.totalViews || 0), icon: Eye },
    { label: "Время просмотра", value: formatWatchTime(stats.stats?.totalWatchTimeSeconds || 0), icon: Clock },
    { label: "Лайкнутые видео", value: stats.stats?.likedVideosCount || 0, icon: Heart },
    { label: "Комментарии", value: stats.stats?.commentsCount || 0, icon: MessageSquare },
    { label: "Подписки", value: stats.stats?.subscriptionsCount || 0, icon: Users },
  ];

  return (
    <div className="p-6 max-w-5xl">
      {/* Back */}
      <Link href="/settings" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 inline-flex">
        <ArrowLeft className="h-4 w-4" />
        Назад к настройкам
      </Link>

      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar
              src={stats.image || session?.user?.image || undefined}
              fallback={stats.name?.[0] || "U"}
              size="lg"
            />
            <div className="flex-1">
              <h1 className="text-xl font-bold">{stats.name}</h1>
              {stats.bio && <p className="text-sm text-muted-foreground mt-1">{stats.bio}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                Зарегистрирован: {formatDateRu(stats.createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
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

      {/* Channels */}
      {stats.channels?.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlaySquare className="h-5 w-5" />
              Мои каналы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.channels.map((channel: {
                id: string;
                name: string;
                slug: string;
                description: string | null;
                _count: { videos: number; subscriptions: number };
              }) => (
                <div key={channel.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h3 className="font-medium">{channel.name}</h3>
                    <p className="text-sm text-muted-foreground">/{channel.slug}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Video className="h-4 w-4" /> {channel._count.videos} видео
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" /> {channel._count.subscriptions} подписчиков
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Views */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            История просмотров
          </CardTitle>
          <CardDescription>Последние просмотренные видео</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentViews?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Нет просмотров</p>
          ) : (
            <div className="space-y-3">
              {stats.recentViews?.map((view: {
                id: string;
                watchedSeconds: number;
                updatedAt: string;
                video: {
                  id: string;
                  title: string;
                  thumbnailKey: string | null;
                  duration: number;
                  channel: { name: string; slug: string };
                };
              }) => {
                const progress = view.video?.duration
                  ? Math.round((view.watchedSeconds / view.video.duration) * 100)
                  : 0;
                return (
                  <Link key={view.id} href={`/watch/${view.video?.id}`}>
                    <div className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{view.video?.title || "Удалённое видео"}</h4>
                        <p className="text-sm text-muted-foreground">
                          {view.video?.channel?.name} &middot; Просмотрено {formatDuration(view.watchedSeconds)} из {view.video?.duration ? formatDuration(view.video.duration) : "0:00"}
                        </p>
                        <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-medium">{progress}%</span>
                        <p className="text-xs text-muted-foreground">{formatRelativeTimeRu(view.updatedAt)}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
