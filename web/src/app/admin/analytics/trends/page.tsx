"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { TrendingUp, TrendingDown, Minus, Clock, Calendar, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/analytics/stat-card";
import { ActivityHeatmap } from "@/components/analytics/activity-heatmap";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TREND_ICONS: Record<string, React.ReactNode> = {
  improving: <TrendingUp className="h-3 w-3 text-green-600" />,
  declining: <TrendingDown className="h-3 w-3 text-red-600" />,
  stable: <Minus className="h-3 w-3 text-amber-600" />,
};

export default function AdminTrends() {
  const t = useTranslations("trends");
  const tCommon = useTranslations("common");
  const [dateRange, setDateRange] = useState<number>(0);
  const [heatmapType, setHeatmapType] = useState<string>("all");

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
  const trendsQuery = new URLSearchParams(dateParams as Record<string, string>).toString();
  const heatmapQuery = new URLSearchParams({ ...dateParams, type: heatmapType }).toString();

  const { data: trendsData, isLoading: trendsLoading } = useSWR(
    `/api/admin/analytics/trends?${trendsQuery}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  const { data: heatmapData, isLoading: heatmapLoading } = useSWR(
    `/api/admin/analytics/heatmap?${heatmapQuery}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  if (trendsLoading || heatmapLoading) return <div className="text-muted-foreground p-6">{tCommon("loading")}</div>;
  if (!trendsData || !heatmapData) return <div className="text-muted-foreground p-6">{tCommon("noData")}</div>;

  const { semesterAnalysis, monthOverMonth, learningVelocity } = trendsData;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Date Range + Heatmap Type */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <div className="flex gap-2">
          {[
            { label: "7d", days: 7 },
            { label: "30d", days: 30 },
            { label: "90d", days: 90 },
            { label: "All", days: 0 },
          ].map((preset) => (
            <button
              key={preset.days}
              onClick={() => setDateRange(preset.days)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === preset.days ? "bg-primary text-primary-foreground" : "border hover:bg-accent"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          {["all", "video_views", "submissions", "quiz_attempts"].map((ht) => (
            <button
              key={ht}
              onClick={() => setHeatmapType(ht)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                heatmapType === ht ? "bg-primary text-primary-foreground" : "border hover:bg-accent"
              }`}
            >
              {ht === "all" ? "All" : ht === "video_views" ? "Views" : ht === "submissions" ? "Submissions" : "Quizzes"}
            </button>
          ))}
        </div>
      </div>

      {/* Semester Analysis Cards */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-lg">{t("semesterAnalysis")}</CardTitle></CardHeader>
        <CardContent>
          {semesterAnalysis.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {semesterAnalysis.map((s: any, i: number) => (
                <div key={i} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    {s.semester}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>{t("enrollments")}: <span className="font-medium">{s.enrollmentCount}</span></p>
                    <p>{t("avgGrade")}: <span className="font-medium">{s.avgGrade.toFixed(1)}%</span></p>
                    <p>{t("completionRate")}: <span className="font-medium">{s.completionRate.toFixed(1)}%</span></p>
                    <p>{t("quizPassRate")}: <span className="font-medium">{s.quizPassRate.toFixed(1)}%</span></p>
                    <p>{t("activeStudents")}: <span className="font-medium">{s.activeStudents}</span></p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">{tCommon("noData")}</div>
          )}
        </CardContent>
      </Card>

      {/* Month-over-Month Table */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-lg">{t("monthOverMonth")}</CardTitle></CardHeader>
        <CardContent>
          {monthOverMonth.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">{t("month")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("enrollments")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("avgGrade")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("submissions")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("quizPassRate")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("change")}</th>
                </tr>
              </thead>
              <tbody>
                {monthOverMonth.map((m: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-3 font-medium">{m.month}</td>
                    <td className="px-4 py-3 text-right">{m.enrollmentCount}</td>
                    <td className="px-4 py-3 text-right">{m.avgGrade.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right">{m.totalSubmissions}</td>
                    <td className="px-4 py-3 text-right">{m.quizPassRate.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right">
                      {m.gradeChange > 0 ? (
                        <span className="text-green-600 flex items-center justify-end gap-1"><TrendingUp className="h-3 w-3" />+{m.gradeChange.toFixed(1)}%</span>
                      ) : m.gradeChange < 0 ? (
                        <span className="text-red-600 flex items-center justify-end gap-1"><TrendingDown className="h-3 w-3" />{m.gradeChange.toFixed(1)}%</span>
                      ) : (
                        <span className="text-muted-foreground flex items-center justify-end gap-1"><Minus className="h-3 w-3" />0%</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center text-muted-foreground py-8">{tCommon("noData")}</div>
          )}
        </CardContent>
      </Card>

      {/* Activity Heatmap */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            {t("activityHeatmap")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {heatmapData?.heatmapData?.length > 0 ? (
            <>
              <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
                <span>Peak day: <strong className="text-foreground">{heatmapData.peakDay}</strong></span>
                <span>Peak hour: <strong className="text-foreground">{heatmapData.peakHour}</strong></span>
                <span>Total activity: <strong className="text-foreground">{heatmapData.totalActivity.toLocaleString()}</strong></span>
              </div>
              <ActivityHeatmap data={heatmapData.heatmapData} />
            </>
          ) : (
            <div className="text-center text-muted-foreground py-12">{tCommon("noData")}</div>
          )}
        </CardContent>
      </Card>

      {/* Learning Velocity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-600" />
            {t("learningVelocity")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {learningVelocity.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">{t("student")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("email")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("completionsPerWeek")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("trend")}</th>
                </tr>
              </thead>
              <tbody>
                {learningVelocity.map((v: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-3 font-medium">{v.name || v.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.email}</td>
                    <td className="px-4 py-3 text-right font-medium">{v.completionsPerWeek.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-1.5">
                      {TREND_ICONS[v.trend]}
                      <span className={`text-xs ${v.trend === "improving" ? "text-green-600" : v.trend === "declining" ? "text-red-600" : "text-amber-600"}`}>
                        {t(v.trend)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center text-muted-foreground py-8">{tCommon("noData")}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
