"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Users, BookOpen, TrendingUp, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";

const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const ScatterChart = dynamic(() => import("recharts").then((m) => m.ScatterChart), { ssr: false });
const Scatter = dynamic(() => import("recharts").then((m) => m.Scatter), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminComparative() {
  const t = useTranslations("comparative");
  const tCommon = useTranslations("common");
  const [tab, setTab] = useState<string>("students");
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
  const queryString = new URLSearchParams({
    type: tab,
    ...dateParams,
  } as Record<string, string>).toString();

  const { data, isLoading, error } = useSWR(
    `/api/admin/analytics/comparative?${queryString}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  if (error) return <div className="text-red-600 p-6">{tCommon("error")}</div>;
  if (isLoading) return <div className="text-muted-foreground p-6">{tCommon("loading")}</div>;
  if (!data) return <div className="text-muted-foreground p-6">{tCommon("noData")}</div>;

  const tabs = [
    { id: "students", label: t("students"), icon: Users },
    { id: "teachers", label: t("teachers"), icon: GraduationCap },
    { id: "courses", label: t("courses"), icon: BookOpen },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Tabs + Date Range */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <div className="flex gap-2">
          {tabs.map((tabItem) => {
            const Icon = tabItem.icon;
            return (
              <button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  tab === tabItem.id ? "bg-primary text-primary-foreground" : "border hover:bg-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tabItem.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 ml-auto">
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
      </div>

      {/* Students Tab */}
      {tab === "students" && (
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("studentComparison")}</CardTitle></CardHeader>
          <CardContent>
            {data.studentComparisons?.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">{t("student")}</th>
                    <th className="text-left px-4 py-3 font-medium">{t("course")}</th>
                    <th className="text-right px-4 py-3 font-medium">{t("grade")}</th>
                    <th className="text-right px-4 py-3 font-medium">{t("submissions")}</th>
                    <th className="text-right px-4 py-3 font-medium">{t("quizAttempts")}</th>
                    <th className="text-right px-4 py-3 font-medium">{t("quizPassRate")}</th>
                    <th className="text-right px-4 py-3 font-medium">{t("completionRate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.studentComparisons.map((s: any, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-3 font-medium">{s.name || s.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.courseTitle}</td>
                      <td className={`px-4 py-3 text-right font-medium ${s.grade >= 80 ? "text-green-600" : s.grade >= 60 ? "text-amber-600" : "text-red-600"}`}>{s.grade.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right">{s.submissionCount}</td>
                      <td className="px-4 py-3 text-right">{s.quizAttempts}</td>
                      <td className="px-4 py-3 text-right">{s.quizPassRate.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right">{s.completionRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center text-muted-foreground py-8">{tCommon("noData")}</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Teachers Tab */}
      {tab === "teachers" && (
        <>
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-lg">{t("teacherPerformance")}</CardTitle></CardHeader>
            <CardContent>
              {data.teacherPerformance?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.teacherPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="teacherName" type="category" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="avgGrade" fill="#3b82f6" name={t("avgGrade")} />
                    <Bar dataKey="avgQuizScore" fill="#10b981" name={t("avgQuizScore")} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-12">{tCommon("noData")}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">{t("teachers")} — {t("details")}</CardTitle></CardHeader>
            <CardContent>
              {data.teacherPerformance?.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">{t("teacher")}</th>
                      <th className="text-right px-4 py-3 font-medium">{t("courseCount")}</th>
                      <th className="text-right px-4 py-3 font-medium">{t("totalStudents")}</th>
                      <th className="text-right px-4 py-3 font-medium">{t("avgGrade")}</th>
                      <th className="text-right px-4 py-3 font-medium">{t("avgQuizScore")}</th>
                      <th className="text-right px-4 py-3 font-medium">{t("passRate")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.teacherPerformance.map((t2: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-3 font-medium">{t2.teacherName}</td>
                        <td className="px-4 py-3 text-right">{t2.courseCount}</td>
                        <td className="px-4 py-3 text-right">{t2.totalStudents}</td>
                        <td className="px-4 py-3 text-right">{t2.avgGrade.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right">{t2.avgQuizScore.toFixed(1)}</td>
                        <td className="px-4 py-3 text-right">{t2.passRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center text-muted-foreground py-8">{tCommon("noData")}</div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Courses Tab (Difficulty) */}
      {tab === "courses" && (
        <>
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-lg">{t("courseDifficulty")}</CardTitle></CardHeader>
            <CardContent>
              {data.courseDifficulty?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="avgGrade" name={t("avgGrade")} tick={{ fontSize: 11 }} label={{ value: t("avgGrade") + " (%)", position: "insideBottom", offset: -5 }} />
                    <YAxis dataKey="difficultyScore" name={t("difficultyScore")} tick={{ fontSize: 11 }} label={{ value: t("difficultyScore"), angle: -90, position: "insideLeft" }} />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value: number) => value.toFixed(1)} />
                    <Scatter name={t("courses")} data={data.courseDifficulty} fill="#3b82f6" />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-12">{tCommon("noData")}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">{t("courseDifficulty")} — {tCommon("details")}</CardTitle></CardHeader>
            <CardContent>
              {data.courseDifficulty?.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">{t("course")}</th>
                      <th className="text-right px-4 py-3 font-medium">{t("avgGrade")}</th>
                      <th className="text-right px-4 py-3 font-medium">{t("avgStdDev")}</th>
                      <th className="text-right px-4 py-3 font-medium">{t("failureRate")}</th>
                      <th className="text-right px-4 py-3 font-medium">{t("difficultyScore")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.courseDifficulty.map((c: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-3 font-medium">{c.courseTitle}</td>
                        <td className="px-4 py-3 text-right">{c.avgGrade.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right">{c.gradeStdDev.toFixed(1)}</td>
                        <td className="px-4 py-3 text-right">{c.failureRate.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right font-medium">{c.difficultyScore.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center text-muted-foreground py-8">{tCommon("noData")}</div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
