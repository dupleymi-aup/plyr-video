"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Video {
  id: string;
  title: string;
  status: string;
  visibility: string;
  viewCount: number;
  channel: { name: string };
  createdAt: string;
}

export default function AdminVideosPage() {
  const t = useTranslations("adminVideos");
  const tCommon = useTranslations("common");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/videos")
      .then((res) => res.json())
      .then((data) => {
        setVideos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const deleteVideo = async (videoId: string) => {
    if (!confirm(tCommon("delete") + "?")) return;
    const res = await fetch("/api/admin/videos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
    if (res.ok) setVideos((v) => v.filter((x) => x.id !== videoId));
  };

  const updateVisibility = async (videoId: string, visibility: string) => {
    const res = await fetch("/api/admin/videos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, visibility }),
    });
    if (res.ok) {
      setVideos((v) =>
        v.map((x) => (x.id === videoId ? { ...x, visibility } : x))
      );
    }
  };

  if (loading) return <div className="text-muted-foreground">{tCommon("loading")}</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("all")} ({videos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">{t("videoTitle")}</th>
                  <th className="text-left py-2 px-3">{t("channel")}</th>
                  <th className="text-left py-2 px-3">{tCommon("status")}</th>
                  <th className="text-left py-2 px-3">{t("visibility")}</th>
                  <th className="text-left py-2 px-3">{t("views")}</th>
                  <th className="text-left py-2 px-3">{tCommon("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video) => (
                  <tr key={video.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">{video.title}</td>
                    <td className="py-2 px-3">{video.channel?.name}</td>
                    <td className="py-2 px-3">{video.status}</td>
                    <td className="py-2 px-3">
                      <select
                        value={video.visibility}
                        onChange={(e) =>
                          updateVisibility(video.id, e.target.value)
                        }
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="PUBLIC">{t("public")}</option>
                        <option value="UNLISTED">{t("unlisted")}</option>
                        <option value="PRIVATE">{t("private")}</option>
                      </select>
                    </td>
                    <td className="py-2 px-3">{video.viewCount}</td>
                    <td className="py-2 px-3">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteVideo(video.id)}
                      >
                        {tCommon("delete")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
