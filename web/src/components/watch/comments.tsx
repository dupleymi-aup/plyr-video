"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { formatRelativeTimeRu } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; image: string | null };
  replies: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string; image: string | null };
  }>;
  _count: { replies: number };
}

export function Comments({ videoId }: { videoId: string }) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: comments, isLoading } = useSWR<CommentData[]>(
    `/api/comments?videoId=${videoId}`,
    fetcher
  );

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    const text = parentId ? replyContent : content;
    if (!text.trim() || !session) return;

    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, videoId, parentId }),
    });

    if (parentId) {
      setReplyingTo(null);
      setReplyContent("");
    } else {
      setContent("");
    }
    mutate(`/api/comments?videoId=${videoId}`);
  };

  if (isLoading) {
    return <div className="py-4 text-muted-foreground">Загрузка комментариев...</div>;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Комментарии {comments?.length ? `(${comments.length})` : ""}
      </h3>

      {/* Comment form */}
      {session ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            <Avatar
              src={session.user?.image || undefined}
              fallback={session.user?.name?.[0] || "U"}
              size="sm"
            />
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Написать комментарий..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={2}
              />
              {content.trim() && (
                <Button type="submit" size="sm" className="mt-2">
                  Отправить
                </Button>
              )}
            </div>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground mb-6">
          <a href="/login" className="text-primary hover:underline">Войдите</a>, чтобы оставить комментарий
        </p>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments?.length === 0 && (
          <p className="text-muted-foreground text-center py-4">Пока нет комментариев</p>
        )}
        {comments?.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar
              src={comment.user.image || undefined}
              fallback={comment.user.name?.[0] || "U"}
              size="sm"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{comment.user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTimeRu(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm mt-1">{comment.content}</p>
              {session && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="text-xs text-muted-foreground hover:text-foreground mt-1"
                >
                  Ответить
                </button>
              )}

              {/* Reply form */}
              {replyingTo === comment.id && session && (
                <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-2 flex gap-2">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Написать ответ..."
                    className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={2}
                    autoFocus
                  />
                  {replyContent.trim() && (
                    <Button type="submit" size="sm">
                      Ответить
                    </Button>
                  )}
                </form>
              )}

              {/* Replies */}
              {comment.replies?.map((reply) => (
                <div key={reply.id} className="flex gap-2 mt-2 ml-4">
                  <Avatar
                    src={reply.user.image || undefined}
                    fallback={reply.user.name?.[0] || "U"}
                    size="sm"
                    className="h-6 w-6 text-xs"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{reply.user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTimeRu(reply.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm">{reply.content}</p>
                  </div>
                </div>
              ))}

              {comment._count?.replies > 3 && (
                <p className="text-xs text-muted-foreground mt-1 ml-4">
                  Ещё {comment._count.replies - 3} ответов
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
