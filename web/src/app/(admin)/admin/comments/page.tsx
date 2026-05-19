"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { MessageSquare, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatRelativeTimeRu } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminCommentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSWR(
    `/api/admin/comments?page=${page}&limit=20`,
    fetcher
  );

  const handleDelete = async (commentId: string) => {
    if (!confirm("Удалить этот комментарий и все ответы?")) return;
    await fetch("/api/admin/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    mutate(`/api/admin/comments?page=${page}&limit=20`);
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
          <MessageSquare className="h-6 w-6" />
          Комментарии
        </h1>
        <p className="text-muted-foreground">Модерация комментариев</p>
      </div>

      <div className="space-y-3">
        {data?.comments?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Нет комментариев
            </CardContent>
          </Card>
        ) : (
          data?.comments?.map((comment: any) => (
            <Card key={comment.id}>
              <CardContent className="flex items-start gap-4 p-4">
                <Avatar
                  fallback={comment.user.name?.[0] || "U"}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{comment.user.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTimeRu(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Видео: {comment.video?.title || "Удалено"}
                  </p>
                  {comment._count?.replies > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {comment._count.replies} ответов
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => handleDelete(comment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
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
