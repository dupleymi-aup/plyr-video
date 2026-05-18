"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Video, Tv, AlertTriangle, ShieldCheck, BookOpen, GraduationCap, MessageSquare, Heart, Clock, FileText, Award } from "lucide-react";
import { formatWatchTime } from "@/components/analytics/formatters";

interface Stats {
  totalUsers: number;
  totalVideos: number;
  totalChannels: number;
  bannedUsers: number;
  studentCount: number;
  teacherCount: number;
  adminCount: number;
  totalComments: number;
  totalLikes: number;
  totalCourses: number;
  totalEnrollments: number;
  totalGrades: number;
  totalSubmissions: number;
  totalQuizAttempts: number;
  totalLessonCompletions: number;
  totalWatchSeconds: number;
}

export default function AdminDashboard() {
  const t = useTranslations("admin");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-muted-foreground">{t("loading")}</div>;
  }

  const cards = [
    { label: t("totalUsers"), value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-600" },
    { label: t("totalVideos"), value: stats?.totalVideos ?? 0, icon: Video, color: "text-green-600" },
    { label: t("totalChannels"), value: stats?.totalChannels ?? 0, icon: Tv, color: "text-purple-600" },
    { label: t("bannedUsers"), value: stats?.bannedUsers ?? 0, icon: AlertTriangle, color: "text-red-600" },
  ];

  const roleCards = [
    { label: t("students"), value: stats?.studentCount ?? 0, icon: GraduationCap, color: "text-green-600" },
    { label: t("teachers"), value: stats?.teacherCount ?? 0, icon: BookOpen, color: "text-amber-600" },
    { label: t("admins"), value: stats?.adminCount ?? 0, icon: ShieldCheck, color: "text-red-600" },
  ];

  const educationCards = [
    { label: t("totalCourses"), value: stats?.totalCourses ?? 0, icon: BookOpen, color: "text-blue-600" },
    { label: t("totalEnrollments"), value: stats?.totalEnrollments ?? 0, icon: Users, color: "text-green-600" },
    { label: t("totalWatchTime"), value: formatWatchTime(stats?.totalWatchSeconds ?? 0), icon: Clock, color: "text-purple-600" },
    { label: t("totalComments"), value: stats?.totalComments ?? 0, icon: MessageSquare, color: "text-amber-600" },
    { label: t("totalLikes"), value: stats?.totalLikes ?? 0, icon: Heart, color: "text-pink-600" },
    { label: t("totalGrades"), value: stats?.totalGrades ?? 0, icon: Award, color: "text-indigo-600" },
    { label: t("totalSubmissions"), value: stats?.totalSubmissions ?? 0, icon: FileText, color: "text-cyan-600" },
    { label: t("totalCompletions"), value: stats?.totalLessonCompletions ?? 0, icon: GraduationCap, color: "text-emerald-600" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
        <p className="text-muted-foreground">{t("systemOverview")}</p>
      </div>

      <h2 className="text-sm font-medium text-muted-foreground mb-2">{t("systemStats")}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <h2 className="text-sm font-medium text-muted-foreground mb-2">{t("usersByRole")}</h2>
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {roleCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <h2 className="text-sm font-medium text-muted-foreground mb-2">{t("educationStats")}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {educationCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
