"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Trash2, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { formatViews, formatDateRu, formatDuration } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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

export default function AdminVideosPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const { data, isLoading } = useSWR(
    `/api/admin/videos?page=${page}&limit=20${status ? `&status=${status}` : ""}`,
    fetcher
  );

  const handleDelete = async (videoId: string) => {
    if (!confirm("Удалить это видео?")) return;
    await fetch("/api/admin/videos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
    mutate(`/api/admin/videos?page=${page}&limit=20${status ? `&status=${status}` : ""}`);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-12 animate-pulse rounded bg-secondary" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Video className="h-6 w-6" />
          Управление видео
        </h1>
        <p className="text-muted-foreground">Модерация и удаление видео</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="text-sm rounded border bg-background px-3 py-1.5"
        >
          <option value="">Все статусы</option>
          <option value="READY">Готово</option>
          <option value="PROCESSING">Обработка</option>
          <option value="UPLOADING">Загрузка</option>
          <option value="FAILED">Ошибка</option>
          <option value="DELETED">Удалено</option>
        </select>
      </div>

      {/* Videos List */}
      <div className="space-y-3">
        {data?.videos?.map((video: {
          id: string;
          title: string;
          status: string;
          visibility: string;
          duration: number;
          viewCount: number;
          likeCount: number;
          commentCount: number;
          createdAt: string;
          channel: { name: string; slug: string };
        }) => (
          <Card key={video.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{video.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {video.channel?.name} &middot; {formatDuration(video.duration)} &middot; {formatViews(video.viewCount)} просмотров
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[video.status] || "bg-gray-100 text-gray-700"}`}>
                  {statusLabels[video.status] || video.status}
                </span>
                <span className="text-xs text-muted-foreground hidden lg:inline">
                  {visibilityLabels[video.visibility] || video.visibility}
                </span>
                <span className="text-xs text-muted-foreground hidden xl:inline">
                  {formatDateRu(video.createdAt)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(video.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Страница {page} из {data.pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
