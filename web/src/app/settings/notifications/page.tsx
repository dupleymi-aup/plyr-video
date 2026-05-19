"use client";

import useSWR, { mutate } from "swr";
import { Bell, ThumbsUp, MessageSquare, Users, Video, Check, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTimeRu, formatDateRu } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
});

const notificationIcons: Record<string, React.ReactNode> = {
  NEW_SUBSCRIBER: <Users className="h-4 w-4 text-blue-500" />,
  NEW_COMMENT: <MessageSquare className="h-4 w-4 text-green-500" />,
  COMMENT_REPLY: <MessageSquare className="h-4 w-4 text-purple-500" />,
  VIDEO_PUBLISHED: <Video className="h-4 w-4 text-orange-500" />,
  VIDEO_LIKED: <ThumbsUp className="h-4 w-4 text-red-500" />,
  SYSTEM: <Bell className="h-4 w-4 text-gray-500" />,
};

export default function NotificationsPage() {
  const { data, isLoading } = useSWR("/api/notifications", fetcher);

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    mutate("/api/notifications");
  };

  const markAllAsRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    mutate("/api/notifications");
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Уведомления
          </h1>
          <p className="text-muted-foreground">
            {data?.unreadCount > 0 ? `${data.unreadCount} непрочитанных` : "Все прочитано"}
          </p>
        </div>
        {data?.unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-1" />
            Прочитать все
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {data?.notifications?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>Нет уведомлений</p>
            </CardContent>
          </Card>
        ) : (
          data?.notifications?.map((notification: any) => (
            <Card
              key={notification.id}
              className={!notification.isRead ? "border-l-4 border-l-primary" : ""}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  {notificationIcons[notification.type] || notificationIcons.SYSTEM}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{notification.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTimeRu(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
