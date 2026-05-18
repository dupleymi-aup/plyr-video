"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Award, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/analytics/stat-card";
import dynamic from "next/dynamic";

const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const GRADE_COLORS: Record<string, string> = {
  A: "#10b981",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#ef4444",
  F: "#7f1d1d",
};

export default function AdminGrades() {
  const t = useTranslations("grades");
  const tCommon = useTranslations("common");
  const tAnalytics = useTranslations("analytics");
  const [dateRange, setDateRange] = useState<number>(0);

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
    `/api/admin/analytics/grades?${queryString}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  if (error) return <div className="text-red-600 p-6">{tCommon("error") || "Ошибка загрузки"}</div>;
  if (isLoading) return <div className="text-muted-foreground p-6">{tCommon("loading")}</div>;
  if (!data) return <div className="text-muted-foreground p-6">{tCommon("noData")}</div>;

  const { overview, gradeDistribution, courseGrades, topStudents, strugglingStudents } = data;

  const gradeLabels: Record<string, string> = {
    A: t("gradeA"),
    B: t("gradeB"),
    C: t("gradeC"),
    D: t("gradeD"),
    F: t("gradeF"),
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Date Range Presets */}
      <div className="flex gap-2 mb-6">
        {[
          { label: tAnalytics("last7days"), days: 7 },
          { label: tAnalytics("last30days"), days: 30 },
          { label: tAnalytics("last90days"), days: 90 },
          { label: tAnalytics("allTime"), days: 0 },
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label={t("totalGrades")}
          value={overview.totalGrades}
          icon={Award}
          color="text-blue-600"
        />
        <StatCard
          label={t("avgGrade")}
          value={`${overview.avgGrade.toFixed(1)}%`}
          icon={BarChart3}
          color="text-green-600"
        />
        <StatCard
          label={t("passRate")}
          value={`${overview.passRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="text-emerald-600"
        />
        <StatCard
          label={`${t("minGrade")} / ${t("maxGrade")}`}
          value={`${overview.minGrade.toFixed(0)} / ${overview.maxGrade.toFixed(0)}`}
          icon={TrendingDown}
          color="text-amber-600"
        />
      </div>

      {/* Grade Distribution */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{t("gradeDistribution")}</CardTitle>
        </CardHeader>
        <CardContent>
          {gradeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  dataKey="count"
                  nameKey="bucket"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ bucket, count }: any) => `${gradeLabels[bucket]}: ${count}`}
                >
                  {gradeDistribution.map((entry: any) => (
                    <Cell key={entry.bucket} fill={GRADE_COLORS[entry.bucket] || "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground py-12">{tCommon("noData")}</div>
          )}
        </CardContent>
      </Card>

      {/* Per-Course Grade Stats */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{t("courseGrades")}</CardTitle>
        </CardHeader>
        <CardContent>
          {courseGrades.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">{t("course")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("teacher")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("gradeCount")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("avgGradeCol")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("minGradeCol")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("maxGradeCol")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("passRate")}</th>
                </tr>
              </thead>
              <tbody>
                {courseGrades.map((c: any) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{c.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.teacherName || "—"}</td>
                    <td className="px-4 py-3 text-right">{c.gradeCount}</td>
                    <td className="px-4 py-3 text-right">{c.avgGrade.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right">{c.minGrade.toFixed(0)}</td>
                    <td className="px-4 py-3 text-right">{c.maxGrade.toFixed(0)}</td>
                    <td className="px-4 py-3 text-right">{c.passRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center text-muted-foreground py-8">{tCommon("noData")}</div>
          )}
        </CardContent>
      </Card>

      {/* Top & Struggling Students */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              {t("topStudents")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topStudents.length > 0 ? (
              <div className="space-y-2">
                {topStudents.map((s: any) => (
                  <div key={s.id} className="flex justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{s.name || s.email}</p>
                      <p className="text-xs text-muted-foreground">{s.gradeCount} оценок • {s.coursesCompleted} курсов</p>
                    </div>
                    <span className="font-medium text-green-600">{s.avgGrade.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">{tCommon("noData")}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              {t("strugglingStudents")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strugglingStudents.length > 0 ? (
              <div className="space-y-2">
                {strugglingStudents.map((s: any) => (
                  <div key={s.id} className="flex justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{s.name || s.email}</p>
                      <p className="text-xs text-muted-foreground">{s.gradeCount} оценок • {s.coursesCompleted} курсов</p>
                    </div>
                    <span className={`font-medium ${s.avgGrade < 60 ? "text-red-600" : "text-amber-600"}`}>
                      {s.avgGrade.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">{tCommon("noData")}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
