"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { formatWatchTime } from "@/components/analytics/formatters";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AnalyticsStudents() {
  const t = useTranslations("students");
  const tCommon = useTranslations("common");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRange, setDateRange] = useState(30);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const getDateParams = useCallback(() => {
    if (dateRange === 0) return {};
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - dateRange);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, [dateRange]);

  const dateParams = getDateParams();
  const queryString = new URLSearchParams({
    page: String(page),
    search: encodeURIComponent(debouncedSearch),
    ...dateParams,
  } as Record<string, string>).toString();

  const { data, isLoading, error } = useSWR(
    `/api/admin/analytics/students?${queryString}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const students = data?.students || [];
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
          { label: t("last7days"), days: 7 },
          { label: t("last30days"), days: 30 },
          { label: t("last90days"), days: 90 },
          { label: t("allTime"), days: 0 },
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

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">{t("name")}</th>
              <th className="text-left px-4 py-3 font-medium">{t("email")}</th>
              <th className="text-right px-4 py-3 font-medium">{t("watchTime")}</th>
              <th className="text-right px-4 py-3 font-medium">{t("videos")}</th>
              <th className="text-right px-4 py-3 font-medium">{t("views")}</th>
              <th className="text-right px-4 py-3 font-medium">{t("comments")}</th>
              <th className="text-right px-4 py-3 font-medium">{t("likes")}</th>
              <th className="text-center px-4 py-3 font-medium">{tCommon("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  {tCommon("loading")}
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  {t("notFound")}
                </td>
              </tr>
            ) : (
              students.map((s: any) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{s.name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.email || "—"}</td>
                  <td className="px-4 py-3 text-right">{formatWatchTime(s.totalSeconds)}</td>
                  <td className="px-4 py-3 text-right">{s.videosWatched}</td>
                  <td className="px-4 py-3 text-right">{s.totalViews}</td>
                  <td className="px-4 py-3 text-right">{s.commentCount}</td>
                  <td className="px-4 py-3 text-right">{s.likeCount}</td>
                  <td className="px-4 py-3 text-center">
                    <Link href={`/admin/analytics/students/${s.id}`} className="text-primary hover:underline text-xs">
                      {t("details")}
                    </Link>
                  </td>
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
