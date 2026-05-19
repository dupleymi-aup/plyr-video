"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Target, AlertTriangle, TrendingUp, Award, BookOpen, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/analytics/stat-card";
import dynamic from "next/dynamic";

const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((m) => m.Area), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const DISTRIBUTION_COLORS: Record<string, string> = {
  "90-100": "#10b981",
  "80-89": "#3b82f6",
  "70-79": "#f59e0b",
  "60-69": "#ef4444",
  "0-59": "#7f1d1d",
};

export default function AdminPerformance() {
  const t = useTranslations("performance");
  const tCommon = useTranslations("common");
  const tAnalytics = useTranslations("analytics");
  const [dateRange, setDateRange] = useState<number>(0);
  const [granularity, setGranularity] = useState<string>("daily");

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
    ...dateParams,
    granularity,
  } as Record<string, string>).toString();

  const { data, isLoading, error } = useSWR(
    `/api/admin/analytics/performance?${queryString}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  if (error) return <div className="text-red-600 p-6">{tCommon("error")}</div>;
  if (isLoading) return <div className="text-muted-foreground p-6">{tCommon("loading")}</div>;
  if (!data) return <div className="text-muted-foreground p-6">{tCommon("noData")}</div>;

  const { overview, performanceTrend, courseComparisons, submissionRates, quizPassRateTrend, performanceDistribution, cohortAnalysis, atRiskStudents } = data;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <div className="flex gap-2">
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
        <div className="flex gap-2 ml-auto">
          {["daily", "weekly", "monthly"].map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                granularity === g ? "bg-primary text-primary-foreground" : "border hover:bg-accent"
              }`}
            >
              {t(g)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label={t("totalSubmissions")}
          value={overview.totalSubmissions}
          icon={BookOpen}
          color="text-blue-600"
        />
        <StatCard
          label={t("avgSubmissionScore")}
          value={`${overview.avgSubmissionScore.toFixed(1)}%`}
          icon={Award}
          color="text-green-600"
        />
        <StatCard
          label={t("quizPassRate")}
          value={`${overview.quizPassRate.toFixed(1)}%`}
          icon={CheckCircle}
          color="text-emerald-600"
        />
        <StatCard
          label={t("submissionCompletionRate")}
          value={`${overview.submissionCompletionRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="text-purple-600"
        />
      </div>

      {/* Charts Row 1: Trend + Course Comparison */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("performanceTrend")}</CardTitle></CardHeader>
          <CardContent>
            {performanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area yAxisId="left" type="monotone" dataKey="avgScore" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name={t("chartAvgScore")} />
                  <Area yAxisId="right" type="monotone" dataKey="submissionCount" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name={t("chartSubmissionCount")} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-12">{tCommon("noData")}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{t("courseComparison")}</CardTitle></CardHeader>
          <CardContent>
            {courseComparisons.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={courseComparisons}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="courseTitle" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="avgGrade" fill="#3b82f6" name={t("avgGrade")} />
                  <Bar dataKey="avgSubmissionScore" fill="#10b981" name={t("avgSubmissionScore")} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-12">{tCommon("noData")}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Distribution + Quiz Trend */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("performanceDistribution")}</CardTitle></CardHeader>
          <CardContent>
            {performanceDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={performanceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="studentCount" fill="#3b82f6" name={t("students")}>
                    {performanceDistribution.map((entry: any) => (
                      <Bar key={entry.range} fill={DISTRIBUTION_COLORS[entry.range] || "#6b7280"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-12">{tCommon("noData")}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{t("quizPassRateTrend")}</CardTitle></CardHeader>
          <CardContent>
            {quizPassRateTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={quizPassRateTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="passRate" stroke="#10b981" strokeWidth={2} dot={false} name={t("chartPassRate")} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-12">{tCommon("noData")}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cohort Analysis Table */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-lg">{t("cohortAnalysis")}</CardTitle></CardHeader>
        <CardContent>
          {cohortAnalysis.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">{t("cohort")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("students")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("avgGrade")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("completionRate")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("activeStudents")}</th>
                </tr>
              </thead>
              <tbody>
                {cohortAnalysis.map((c: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-3 font-medium">{c.cohortLabel}</td>
                    <td className="px-4 py-3 text-right">{c.studentCount}</td>
                    <td className="px-4 py-3 text-right">{c.avgGrade.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right">{c.completionRate.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right">{c.activeStudents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center text-muted-foreground py-8">{tCommon("noData")}</div>
          )}
        </CardContent>
      </Card>

      {/* At-Risk Students */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            {t("atRiskStudents")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {atRiskStudents.length > 0 ? (
            <div className="space-y-3">
              {atRiskStudents.map((s: any) => (
                <div key={s.id} className={`flex flex-wrap items-center justify-between p-3 rounded-lg border ${s.riskScore >= 70 ? "border-red-300 bg-red-50 dark:bg-red-950/20" : "border-amber-300 bg-amber-50 dark:bg-amber-950/20"}`}>
                  <div>
                    <p className="font-medium text-sm">{s.name || s.email}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t("avgGrade")}: <span className={s.avgGrade < 60 ? "text-red-600 font-medium" : "text-amber-600 font-medium"}>{s.avgGrade.toFixed(1)}%</span></p>
                      <p className="text-xs text-muted-foreground">{t("riskScore")}: <span className="font-bold">{s.riskScore}</span></p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {s.riskFactors.map((f: string) => (
                        <span key={f} className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{t(f)}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">{tCommon("noData")}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
