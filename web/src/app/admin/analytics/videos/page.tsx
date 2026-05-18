"use client";

import { useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatWatchTime } from "@/components/analytics/formatters";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AnalyticsVideos() {
  const t = useTranslations("videos");
  const tCommon = useTranslations("common");
  const tAnalytics = useTranslations("analytics");
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState(0);

  const getDateParams = () => {
    if (dateRange === 0) return {};
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - dateRange);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  };

  const dateParams = getDateParams();
  const queryString = new URLSearchParams({
    page: String(page),
    ...dateParams,
  } as Record<string, string>).toString();

  const { data, isLoading, error } = useSWR(
    `/api/admin/analytics/videos?${queryString}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const videos = data?.videos || [];
  const totalPages = data?.totalPages || 1;

  if (error) return <div className="text-red-600 p-6">{tCommon("error") || "Ошибка загрузки"}</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Date Range Presets */}
      <div className="flex gap-2 mb-4">
        {[
          { label: tAnalytics("allTime"), days: 0 },
          { label: tAnalytics("last7days"), days: 7 },
          { label: tAnalytics("last30days"), days: 30 },
          { label: tAnalytics("last90days"), days: 90 },
        ].map((preset) => (
          <button
            key={preset.days}
            onClick={() => { setDateRange(preset.days); setPage(1); }}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              dateRange === preset.days
                ? "bg-primary text-primary-foreground"
                : "border hover:bg-accent"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">{t("titleCol")}</th>
              <th className="text-right px-4 py-3 font-medium">{t("duration")}</th>
              <th className="text-right px-4 py-3 font-medium">{t("viewers")}</th>
              <th className="text-right px-4 py-3 font-medium">{t("views")}</th>
              <th className="text-right px-4 py-3 font-medium">{t("watchTime")}</th>
              <th className="text-right px-4 py-3 font-medium">{t("completion")}</th>
              <th className="text-right px-4 py-3 font-medium">{t("likes")}</th>
              <th className="text-right px-4 py-3 font-medium">{t("comments")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  {tCommon("loading")}
                </td>
              </tr>
            ) : videos.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  {t("notFound")}
                </td>
              </tr>
            ) : (
              videos.map((v: any) => (
                <tr key={v.id} className="border-t">
                  <td className="px-4 py-3 font-medium max-w-xs truncate">{v.title}</td>
                  <td className="px-4 py-3 text-right">
                    {v.duration ? `${Math.floor(v.duration / 60)}:${String(v.duration % 60).padStart(2, "0")}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">{v.uniqueViewers}</td>
                  <td className="px-4 py-3 text-right">{v.totalViews}</td>
                  <td className="px-4 py-3 text-right">
                    {formatWatchTime(v.totalSeconds)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {v.avgCompletion.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right">{v.likeCount}</td>
                  <td className="px-4 py-3 text-right">{v.commentCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            {tCommon("page")} {page} {tCommon("of")} {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border hover:bg-accent transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border hover:bg-accent transition-colors disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
