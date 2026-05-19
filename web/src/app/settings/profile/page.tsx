"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProfileSettingsPage() {
  const { data: session, update } = useSession();
  const { data: profile, isLoading } = useSWR("/api/users/me", fetcher);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      setWebsite(profile.website || "");
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio, location, website }),
    });
    if (res.ok) {
      await update({ name });
      mutate("/api/users/me");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="h-8 w-48 animate-pulse rounded bg-secondary mb-2" />
        <div className="h-4 w-64 animate-pulse rounded bg-secondary mb-8" />
        <Card>
          <CardContent className="pt-6 space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-secondary" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Настройки профиля</h1>
        <p className="text-muted-foreground">Обновите свой публичный профиль</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Публичный профиль</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar
              src={profile?.image || session?.user?.image || undefined}
              fallback={name?.[0] || "U"}
              size="lg"
            />
            <div>
              <Button variant="outline" size="sm" disabled>
                Сменить аватар
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG или GIF. Макс. 2МБ.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Отображаемое имя</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={session?.user?.email || profile?.email || ""}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Email нельзя изменить
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">О себе</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Расскажите о себе"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Местоположение</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Город, страна"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Сайт</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Сохранение..." : saved ? "Сохранено!" : "Сохранить"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
