"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Clock, Eye, Play, MessageSquare, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/analytics/stat-card";
import { formatWatchTime } from "@/components/analytics/formatters";
import dynamic from "next/dynamic";

const BarChart = dynamic(
  () => import("recharts").then((m) => m.BarChart),
  { ssr: false }
);
const Bar = dynamic(
  () => import("recharts").then((m) => m.Bar),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((m) => m.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((m) => m.YAxis),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("recharts").then((m) => m.Tooltip),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => m.CartesianGrid),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StudentDetail() {
  const t = useTranslations("studentDetail");
  const tCommon = useTranslations("common");
  const params = useParams();
  const userId = params?.userId as string;

  const { data, isLoading, error } = useSWR(
    userId ? `/api/admin/analytics/students/${userId}` : null,
    fetcher
  );

  if (error) return <div className="text-red-600 p-6">{tCommon("error") || "Ошибка загрузки"}</div>;
  if (isLoading) return <div className="text-muted-foreground p-6">{tCommon("loading")}</div>;
  if (!data) return <div className="text-muted-foreground p-6">{t("studentNotFound")}</div>;

  const { user, summary, watchHistory, weeklyActivity, comments, likes } = data;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/analytics/students"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToList")}
        </Link>
        <h1 className="text-2xl font-bold">{user.name || t("student")}</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label={t("watchTime")}
          value={formatWatchTime(summary.totalSeconds)}
          icon={Clock}
          color="text-blue-600"
        />
        <StatCard
          label={t("videosWatched")}
          value={summary.videosWatched}
          icon={Eye}
          color="text-green-600"
        />
        <StatCard
          label={t("totalViews")}
          value={summary.totalViews}
          icon={Play}
          color="text-purple-600"
        />
        <StatCard
          label={t("avgCompletion")}
          value={`${summary.avgCompletionRate.toFixed(1)}%`}
          icon={Clock}
          color="text-amber-600"
        />
      </div>

      {/* Weekly Activity Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{t("weeklyActivity")}</CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [formatWatchTime(value), t("time")]}
                />
                <Bar dataKey="totalSeconds" fill="#3b82f6" name={t("timeSec")} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              {t("noActivityData")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Watch History */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{t("watchHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          {watchHistory.length > 0 ? (
            <div className="space-y-3">
              {watchHistory.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{item.video.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.updatedAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatWatchTime(item.watchedSeconds)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.completionRate.toFixed(0)}% {t("completed")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              {t("noWatchHistory")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments & Likes */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t("comments")} ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {comments.length > 0 ? (
              <div className="space-y-3">
                {comments.slice(0, 10).map((c: any) => (
                  <div key={c.id} className="py-2 border-b last:border-0">
                    <p className="text-sm">{c.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("videoLabel")}: {c.video.title} •{" "}
                      {new Date(c.createdAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {t("noComments")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-4 w-4" />
              {t("likes")} ({likes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {likes.length > 0 ? (
              <div className="space-y-3">
                {likes.slice(0, 10).map((l: any) => (
                  <div key={l.id} className="py-2 border-b last:border-0">
                    <p className="text-sm">{l.video.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(l.createdAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {t("noLikes")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
