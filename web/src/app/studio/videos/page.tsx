"use client";

import useSWR from "swr";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Eye, ThumbsUp, MessageSquare } from "lucide-react";
import { formatViews, formatDateRu } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
});

const statusLabels: Record<string, string> = {
  READY: "Готово",
  PROCESSING: "Обработка",
  UPLOADING: "Загрузка",
  FAILED: "Ошибка",
  DELETED: "Удалено",
};

const statusColors: Record<string, string> = {
  READY: "bg-green-100 text-green-700",
  PROCESSING: "bg-yellow-100 text-yellow-700",
  UPLOADING: "bg-blue-100 text-blue-700",
  FAILED: "bg-red-100 text-red-700",
  DELETED: "bg-gray-100 text-gray-500",
};

const visibilityLabels: Record<string, string> = {
  PUBLIC: "Публичное",
  UNLISTED: "По ссылке",
  PRIVATE: "Приватное",
};

export default function StudioVideosPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: profile } = useSWR(userId ? "/api/users/me" : null, fetcher);
  const channelIds = profile?.channels?.map((ch: { id: string }) => ch.id) || [];

  // Fetch videos from user's channels via /api/videos (public only for now)
  const { data: videosData, isLoading } = useSWR(
    "/api/videos?page=1&limit=50",
    fetcher
  );

  // Filter to only user's channel videos
  const myVideos = videosData?.videos?.filter(
    (v: { channelId: string }) => channelIds.includes(v.channelId)
  ) || [];

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Видео</h1>
          <p className="text-muted-foreground">Управление загруженными видео</p>
        </div>
        <Link href="/studio/upload">
          <Button>Загрузить</Button>
        </Link>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          </CardContent>
        </Card>
      ) : myVideos.length === 0 ? (
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
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Видео</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Статус</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Видимость</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Просмотры</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Лайки</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Комментарии</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Дата</th>
                </tr>
              </thead>
              <tbody>
                {myVideos.map((video: {
                  id: string;
                  title: string;
                  status: string;
                  visibility: string;
                  viewCount: number;
                  likeCount: number;
                  commentCount: number;
                  createdAt: string;
                }) => (
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
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[video.status] || "bg-gray-100 text-gray-700"}`}>
                        {statusLabels[video.status] || video.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{visibilityLabels[video.visibility] || video.visibility}</td>
                    <td className="px-4 py-3 text-right text-sm">{formatViews(video.viewCount)}</td>
                    <td className="px-4 py-3 text-right text-sm">{video.likeCount}</td>
                    <td className="px-4 py-3 text-right text-sm">{video.commentCount}</td>
                    <td className="px-4 py-3 text-right text-sm">{formatDateRu(video.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
