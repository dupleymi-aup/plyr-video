"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import {
  TrendingUp,
  Users,
  Play,
  Clock,
  Download,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/analytics/stat-card";
import { formatWatchTime } from "@/components/analytics/formatters";

const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((m) => m.Area), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ROLE_COLORS: Record<string, string> = {
  STUDENT: "#3b82f6",
  TEACHER: "#f59e0b",
  ADMIN: "#ef4444",
};

export default function AnalyticsDashboard() {
  const t = useTranslations("analytics");
  const tCommon = useTranslations("common");
  const [dateRange, setDateRange] = useState<number>(30);
  const [exporting, setExporting] = useState(false);

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
  const queryString = new URLSearchParams(dateParams as Record<string, string>).toString();

  const { data, isLoading, error } = useSWR(
    `/api/admin/analytics/overview?${queryString}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  const handleExport = async (type: string) => {
    setExporting(true);
    const res = await fetch("/api/admin/analytics/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...dateParams }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${type}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  };

  if (error) return <div className="text-red-600 p-6">{tCommon("loading")}</div>;
  if (isLoading) return <div className="text-muted-foreground p-6">{tCommon("loading")}</div>;

  const dailyData = data?.dailyWatchTime || [];
  const topVideos = data?.topVideos || [];
  const topStudents = data?.topStudents || [];
  const activityByRole = data?.activityByRole || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport("students")} disabled={exporting} className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border hover:bg-accent transition-colors disabled:opacity-50">
            <Download className="h-4 w-4" />
            {t("exportStudents")}
          </button>
          <button onClick={() => handleExport("videos")} disabled={exporting} className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border hover:bg-accent transition-colors disabled:opacity-50">
            <Download className="h-4 w-4" />
            {t("exportVideos")}
          </button>
        </div>
      </div>

      {/* Date Range Presets */}
      <div className="flex gap-2 mb-6">
        {[
          { label: t("last7days"), days: 7 },
          { label: t("last30days"), days: 30 },
          { label: t("last90days"), days: 90 },
          { label: t("allTime"), days: 0 },
        ].map((preset) => (
          <button
            key={preset.days}
            onClick={() => setDateRange(preset.days)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${dateRange === preset.days ? "bg-primary text-primary-foreground" : "border hover:bg-accent"}`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label={t("watchTime")} value={formatWatchTime(data?.totalWatchSeconds || 0)} icon={Clock} color="text-blue-600" />
        <StatCard label={t("uniqueViewers")} value={data?.uniqueViewers || 0} icon={Users} color="text-green-600" />
        <StatCard label={t("totalViews")} value={data?.totalViews || 0} icon={Play} color="text-purple-600" />
        <StatCard label={t("avgCompletion")} value={`${(data?.avgCompletionRate || 0).toFixed(1)}%`} icon={TrendingUp} color="text-amber-600" />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("dailyTrend")}</CardTitle></CardHeader>
          <CardContent>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip labelFormatter={(label: string) => `${t("chartDate")}: ${label}`} formatter={(value: number, name: string) => {
                    if (name === "totalSeconds") return [formatWatchTime(value), t("chartWatchTime")];
                    if (name === "uniqueViewers") return [value, t("chartViewers")];
                    return [value, name];
                  }} />
                  <Area type="monotone" dataKey="totalSeconds" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name={t("chartTimeSeconds")} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-12">{t("noData")}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{t("activityByRole")}</CardTitle></CardHeader>
          <CardContent>
            {activityByRole.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={activityByRole} dataKey="viewCount" nameKey="role" cx="50%" cy="50%" outerRadius={80} label={({ role, viewCount }: any) => `${role}: ${viewCount}`}>
                    {activityByRole.map((entry: any, index: number) => (
                      <Cell key={entry.role} fill={ROLE_COLORS[entry.role] || "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-12">{t("noData")}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Videos & Students */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("topVideos")}</CardTitle></CardHeader>
          <CardContent>
            {topVideos.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topVideos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="title" type="category" tick={{ fontSize: 11 }} width={150} />
                  <Tooltip formatter={(value: number) => [formatWatchTime(value), t("chartWatchTime")]} />
                  <Bar dataKey="totalSeconds" fill="#3b82f6" name={t("chartTimeSeconds")} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-12">{t("noData")}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{t("topStudents")}</CardTitle></CardHeader>
          <CardContent>
            {topStudents.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topStudents} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={150} />
                  <Tooltip formatter={(value: number, name: string) => name === "totalSeconds" ? [formatWatchTime(value), t("chartWatchTime")] : [value, name]} />
                  <Bar dataKey="totalSeconds" fill="#10b981" name={t("chartTimeSeconds")} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-12">{t("noData")}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
