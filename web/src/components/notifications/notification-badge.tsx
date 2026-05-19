"use client";

import useSWR, { mutate } from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { Bell } from "lucide-react";
import { formatRelativeTimeRu } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const typeLabels: Record<string, string> = {
  NEW_SUBSCRIBER: "Новый подписчик",
  NEW_COMMENT: "Новый комментарий",
  COMMENT_REPLY: "Ответ на комментарий",
  VIDEO_PUBLISHED: "Новое видео",
  VIDEO_LIKED: "Лайк",
  SYSTEM: "Системное",
};

export function NotificationBadge() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const { data } = useSWR(
    session ? "/api/notifications" : null,
    fetcher,
    { refreshInterval: 60000 }
  );

  if (!session) return null;

  const unread = data?.unreadCount || 0;
  const recent = data?.notifications?.slice(0, 5) || [];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-full p-2 hover:bg-accent transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 rounded-md border bg-popover shadow-lg z-50">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Уведомления</h3>
                {unread > 0 && (
                  <span className="text-xs text-muted-foreground">{unread} непрочитанных</span>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Нет уведомлений</p>
              ) : (
                recent.map((n: any) => (
                  <div
                    key={n.id}
                    className={`px-3 py-2.5 hover:bg-accent cursor-pointer ${!n.isRead ? "bg-accent/50" : ""}`}
                  >
                    <p className="text-sm">{n.content}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {typeLabels[n.type]} &middot; {formatRelativeTimeRu(n.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t">
              <Link
                href="/settings/notifications"
                onClick={() => setOpen(false)}
                className="text-sm text-primary hover:underline text-center block"
              >
                Все уведомления
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
