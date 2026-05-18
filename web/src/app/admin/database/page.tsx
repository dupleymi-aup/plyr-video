"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Trash2, RefreshCw } from "lucide-react";

interface DbStats {
  tableSizes: Record<string, number>;
  totalSize: number;
}

export default function AdminDatabasePage() {
  const t = useTranslations("adminDatabase");
  const tCommon = useTranslations("common");
  const [stats, setStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats({
          tableSizes: {
            Users: data.totalUsers,
            Videos: data.totalVideos,
            Channels: data.totalChannels,
            Courses: data.totalCourses || 0,
            Enrollments: data.totalEnrollments || 0,
            Grades: data.totalGrades || 0,
          },
          totalSize: data.totalUsers + data.totalVideos + data.totalChannels,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const runAction = async (name: string) => {
    setAction(name);
    await new Promise((r) => setTimeout(r, 1000));
    setAction(null);
  };

  if (loading) return <div className="text-muted-foreground">{t("loading")}</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t("tableSizes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && (
              <div className="space-y-2">
                {Object.entries(stats.tableSizes).map(([table, count]) => (
                  <div
                    key={table}
                    className="flex justify-between py-2 border-b last:border-0"
                  >
                    <span>{table}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-bold">
                  <span>{t("total")}</span>
                  <span>{stats.totalSize}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("maintenance")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => runAction("refresh")}
              disabled={action !== null}
            >
              <RefreshCw
                className={`h-4 w-4 ${action === "refresh" ? "animate-spin" : ""}`}
              />
              {t("refreshStats")}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-destructive"
              onClick={() => runAction("cleanup")}
              disabled={action !== null}
            >
              <Trash2 className="h-4 w-4" />
              {t("cleanOrphaned")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
