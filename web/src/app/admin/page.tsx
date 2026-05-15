"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Video, Tv, AlertTriangle, ShieldCheck, BookOpen, GraduationCap } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalVideos: number;
  totalChannels: number;
  bannedUsers: number;
  studentCount: number;
  teacherCount: number;
  adminCount: number;
}

export default function AdminDashboard() {
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
    return <div className="text-muted-foreground">Loading...</div>;
  }

  const cards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-600" },
    { label: "Total Videos", value: stats?.totalVideos ?? 0, icon: Video, color: "text-green-600" },
    { label: "Total Channels", value: stats?.totalChannels ?? 0, icon: Tv, color: "text-purple-600" },
    { label: "Banned Users", value: stats?.bannedUsers ?? 0, icon: AlertTriangle, color: "text-red-600" },
  ];

  const roleCards = [
    { label: "Students", value: stats?.studentCount ?? 0, icon: GraduationCap, color: "text-green-600" },
    { label: "Teachers", value: stats?.teacherCount ?? 0, icon: BookOpen, color: "text-amber-600" },
    { label: "Admins", value: stats?.adminCount ?? 0, icon: ShieldCheck, color: "text-red-600" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">System overview and statistics</p>
      </div>

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

      <h2 className="text-lg font-semibold mb-3">Users by Role</h2>
      <div className="grid gap-4 md:grid-cols-3">
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
    </div>
  );
}
