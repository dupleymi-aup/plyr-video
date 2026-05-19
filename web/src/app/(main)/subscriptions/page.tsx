"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { VideoGrid } from "@/components/video/video-grid";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { PlaySquare, Users } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
});

export default function SubscriptionsPage() {
  const { data: session, status } = useSession();

  const { data: subscriptions, isLoading: subsLoading } = useSWR(
    status === "authenticated" ? "/api/subscriptions" : null,
    fetcher
  );

  if (status === "loading") {
    return (
      <div className="p-6 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Подписки</h1>
          <p className="text-muted-foreground">Видео от каналов, на которые вы подписаны</p>
        </div>
        <div className="rounded-lg border p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Войдите, чтобы видеть подписки</p>
          <Link href="/login" className="text-primary hover:underline">
            Войти
          </Link>
        </div>
      </div>
    );
  }

  if (subsLoading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Подписки</h1>
          <p className="text-muted-foreground">Видео от каналов, на которые вы подписаны</p>
        </div>
        <div className="rounded-lg border p-8 text-center">
          <PlaySquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Вы пока ни на кого не подписаны</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Подписки</h1>
        <p className="text-muted-foreground">Каналы, на которые вы подписаны</p>
      </div>

      {/* Subscribed channels */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Ваши каналы</h2>
        <div className="flex flex-wrap gap-3">
          {subscriptions.map((sub: any) => (
            <Link key={sub.id} href={`/channel/${sub.channel.slug}`}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-3 p-3">
                  <Avatar
                    src={sub.channel.avatar || undefined}
                    fallback={sub.channel.name[0]}
                    size="sm"
                  />
                  <div>
                    <h3 className="text-sm font-medium">{sub.channel.name}</h3>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Videos from subscribed channels */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Видео из подписок</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Видео будут отображаться здесь, когда появятся новые публикации
        </p>
      </div>
    </div>
  );
}
