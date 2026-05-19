"use client";

import useSWR from "swr";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Video, Eye, MessageSquare, TrendingUp, UserPlus } from "lucide-react";
import { formatViews, formatDateRu } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
});

export default function AdminDashboard() {
  const { data: stats, isLoading } = useSWR("/api/admin/stats", fetcher);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
    { label: "Пользователи", value: stats.totalUsers, icon: Users, sub: `+${stats.newUsers24h} за 24ч`, color: "text-blue-600" },
    { label: "Видео", value: stats.totalVideos, icon: Video, sub: `+${stats.newVideos24h} за 24ч`, color: "text-green-600" },
    { label: "Просмотры", value: formatViews(stats.totalViews), icon: Eye, sub: `${stats.views24h} за 24ч`, color: "text-purple-600" },
    { label: "Комментарии", value: stats.totalComments, icon: MessageSquare, sub: `+${stats.newComments24h} за 24ч`, color: "text-orange-600" },
  ];

  const maxRegistrations = Math.max(...(stats.registrationsByDay?.map((r: { count: number }) => Number(r.count)) || [1]);
  const maxViews = Math.max(...(stats.viewsByDay?.map((v: { count: number }) => Number(v.count)) || [1]);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Панель администратора</h1>
        <p className="text-muted-foreground">Обзор платформы и статистика</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className={cn("h-4 w-4", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        {/* Registrations Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Регистрации (7 дней)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {stats.registrationsByDay?.map((day: { day: string; count: number }) => {
                const height = Math.max((Number(day.count) / maxRegistrations) * 100, 4);
                return (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">{Number(day.count)}</span>
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {formatDateRu(day.day).slice(0, 5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Views Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Просмотры (7 дней)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {stats.viewsByDay?.map((day: { day: string; count: number }) => {
                const height = Math.max((Number(day.count) / maxViews) * 100, 4);
                return (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">{Number(day.count)}</span>
                    <div
                      className="w-full bg-green-500 rounded-t transition-all"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {formatDateRu(day.day).slice(0, 5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Link href="/admin/users">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium text-center">Управление пользователями</h3>
              <p className="text-sm text-muted-foreground text-center">Просмотр и редактирование пользователей</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/videos">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium text-center">Управление видео</h3>
              <p className="text-sm text-muted-foreground text-center">Модерация и удаление видео</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
