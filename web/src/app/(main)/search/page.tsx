"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { VideoGrid } from "@/components/video/video-grid";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Users } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data, isLoading } = useSWR(
    query ? `/api/search?q=${encodeURIComponent(query)}` : null,
    fetcher
  );

  const formattedVideos = data?.videos?.map((v: any) => ({
    id: v.id,
    title: v.title,
    thumbnail: v.thumbnailKey || "",
    duration: v.duration || 0,
    channelName: v.channel?.name || "Неизвестен",
    channelAvatar: v.channel?.avatar || "",
    views: v.viewCount || 0,
    createdAt: v.publishedAt?.toISOString() || v.createdAt,
  })) || [];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Результаты поиска</h1>
        {query && (
          <p className="text-muted-foreground">
            Результаты по запросу &quot;{query}&quot;
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !query ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          Введите запрос для поиска
        </div>
      ) : data?.videos?.length === 0 && data?.channels?.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          Ничего не найдено
        </div>
      ) : (
        <div className="space-y-8">
          {/* Channels */}
          {data?.channels?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Каналы
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.channels.map((channel: any) => (
                  <Link key={channel.id} href={`/channel/${channel.slug}`}>
                    <Card className="hover:bg-accent transition-colors cursor-pointer">
                      <CardContent className="flex items-center gap-3 p-4">
                        <Avatar
                          src={channel.avatar || undefined}
                          fallback={channel.name[0]}
                          size="md"
                        />
                        <div className="min-w-0">
                          <h3 className="font-medium truncate">{channel.name}</h3>
                          {channel.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {channel.description}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {data?.videos?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Video className="h-5 w-5" />
                Видео
              </h2>
              <VideoGrid videos={formattedVideos} columns={3} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
