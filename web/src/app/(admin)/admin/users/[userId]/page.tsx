import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ArrowLeft, Users, Eye, Clock, Heart, MessageSquare, PlaySquare, Video } from "lucide-react";
import { formatViews, formatWatchTime, formatDateRu, formatRelativeTimeRu, formatDuration } from "@/lib/utils";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      channels: {
        include: {
          _count: {
            select: {
              videos: true,
              subscriptions: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: true,
          likedVideos: true,
          viewHistory: true,
        },
      },
    },
  });

  if (!user) notFound();

  const channelIds = user.channels.map((ch) => ch.id);

  const [totalViews, watchTime] = await Promise.all([
    channelIds.length > 0
      ? prisma.video.aggregate({
          where: { channelId: { in: channelIds } },
          _sum: { viewCount: true },
        })
      : Promise.resolve({ _sum: { viewCount: 0 } }),
    prisma.videoView.aggregate({
      where: { userId },
      _sum: { watchedSeconds: true },
    }),
  ]);

  const recentViews = await prisma.videoView.findMany({
    where: { userId },
    include: {
      video: {
        select: {
          id: true,
          title: true,
          thumbnailKey: true,
          duration: true,
          viewCount: true,
          channel: { select: { name: true, slug: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const totalViewsCount = totalViews._sum.viewCount || 0;
  const totalWatchTimeSeconds = watchTime._sum.watchedSeconds || 0;

  return (
    <div className="p-6 max-w-5xl">
      {/* Back */}
      <Link href="/admin/users" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 inline-flex">
        <ArrowLeft className="h-4 w-4" />
        Назад к пользователям
      </Link>

      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar
              src={user.image || undefined}
              fallback={user.name?.[0] || "U"}
              size="lg"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{user.name}</h1>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.role === "ADMIN" ? "bg-red-100 text-red-700" :
                  user.role === "MODERATOR" ? "bg-blue-100 text-blue-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {user.role === "ADMIN" ? "Администратор" : user.role === "MODERATOR" ? "Модератор" : "Пользователь"}
                </span>
              </div>
              <p className="text-muted-foreground">{user.email}</p>
              {user.bio && <p className="text-sm mt-2">{user.bio}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                Зарегистрирован: {formatDateRu(user.createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Просмотры каналов</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatViews(totalViewsCount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Время просмотра</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatWatchTime(totalWatchTimeSeconds)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Лайкнутые видео</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.likedVideos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Комментарии</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.comments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Channels */}
      {user.channels.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlaySquare className="h-5 w-5" />
              Каналы ({user.channels.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user.channels.map((channel) => (
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
            История просмотров ({recentViews.length})
          </CardTitle>
          <CardDescription>Последние просмотренные видео</CardDescription>
        </CardHeader>
        <CardContent>
          {recentViews.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Нет просмотров</p>
          ) : (
            <div className="space-y-3">
              {recentViews.map((view) => {
                const progress = view.video?.duration
                  ? Math.round((view.watchedSeconds / view.video.duration) * 100)
                  : 0;
                return (
                  <div key={view.id} className="flex items-center gap-4 rounded-lg border p-4">
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
