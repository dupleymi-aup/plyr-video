"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { BookOpen, Users, Award, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/analytics/stat-card";
import dynamic from "next/dynamic";

const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((m) => m.Area), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const GRADE_COLORS: Record<string, string> = {
  A: "#10b981",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#ef4444",
  F: "#7f1d1d",
};

export default function CourseAnalytics() {
  const t = useTranslations("courseAnalytics");
  const tCommon = useTranslations("common");
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
    `/api/admin/analytics/courses?${queryString}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  if (error) return <div className="text-red-600 p-6">{tCommon("error") || "Ошибка загрузки"}</div>;
  if (isLoading) return <div className="text-muted-foreground p-6">{tCommon("loading")}</div>;
  if (!data) return <div className="text-muted-foreground p-6">{tCommon("noData")}</div>;

  const { overview, topCourses, gradeDistribution, enrollmentTrend, quizStats, lessonCompletionStats } = data;

  // Compute overall quiz pass rate
  const totalQuizAttempts = quizStats.reduce((sum: number, q: any) => sum + q.totalAttempts, 0);
  const totalPassed = quizStats.reduce((sum: number, q: any) => sum + q.passedCount, 0);
  const overallPassRate = totalQuizAttempts > 0 ? (totalPassed / totalQuizAttempts) * 100 : 0;

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
          { label: t("last7days"), days: 7 },
          { label: t("last30days"), days: 30 },
          { label: t("last90days"), days: 90 },
          { label: t("allTime"), days: 0 },
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
          label={t("totalCourses")}
          value={overview.totalCourses}
          icon={BookOpen}
          color="text-blue-600"
        />
        <StatCard
          label={t("totalEnrollments")}
          value={overview.totalEnrollments}
          icon={Users}
          color="text-green-600"
        />
        <StatCard
          label={t("avgGrade")}
          value={`${overview.avgGrade.toFixed(1)}%`}
          icon={Award}
          color="text-purple-600"
        />
        <StatCard
          label={t("quizPassRate")}
          value={`${overallPassRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="text-amber-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {/* Enrollment Trend */}
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("enrollmentTrend")}</CardTitle></CardHeader>
          <CardContent>
            {enrollmentTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={enrollmentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="enrollments" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name={t("enrollments")} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-12">{t("noData")}</div>
            )}
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("gradeDistribution")}</CardTitle></CardHeader>
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
              <div className="text-center text-muted-foreground py-12">{t("noData")}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Courses */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-lg">{t("topCourses")}</CardTitle></CardHeader>
        <CardContent>
          {topCourses.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCourses} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="title" type="category" tick={{ fontSize: 11 }} width={150} />
                <Tooltip />
                <Bar dataKey="enrollmentCount" fill="#3b82f6" name={t("enrollments")} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground py-12">{t("noData")}</div>
          )}
        </CardContent>
      </Card>

      {/* Quiz Stats & Lesson Completion */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quiz Statistics */}
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("quizStats")}</CardTitle></CardHeader>
          <CardContent>
            {quizStats.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">{t("quiz")}</th>
                    <th className="text-right px-3 py-2 font-medium">{t("attempts")}</th>
                    <th className="text-right px-3 py-2 font-medium">{t("avgScore")}</th>
                    <th className="text-right px-3 py-2 font-medium">{t("passRate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {quizStats.map((q: any, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">
                        <p className="font-medium">{q.quizTitle}</p>
                        <p className="text-xs text-muted-foreground">{q.courseTitle}</p>
                      </td>
                      <td className="px-3 py-2 text-right">{q.totalAttempts}</td>
                      <td className="px-3 py-2 text-right">{q.avgScore.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right">{q.passRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center text-muted-foreground py-8">{t("noData")}</div>
            )}
          </CardContent>
        </Card>

        {/* Lesson Completion */}
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("lessonCompletion")}</CardTitle></CardHeader>
          <CardContent>
            {lessonCompletionStats.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">{t("course")}</th>
                    <th className="text-right px-3 py-2 font-medium">{t("lessons")}</th>
                    <th className="text-right px-3 py-2 font-medium">{t("enrolledStudents")}</th>
                    <th className="text-right px-3 py-2 font-medium">{t("completionRate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {lessonCompletionStats.map((c: any) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-3 py-2 font-medium">{c.title}</td>
                      <td className="px-3 py-2 text-right">{c.totalLessons}</td>
                      <td className="px-3 py-2 text-right">{c.enrolledStudents}</td>
                      <td className="px-3 py-2 text-right">{c.completionRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center text-muted-foreground py-8">{t("noData")}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
