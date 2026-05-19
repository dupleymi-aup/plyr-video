"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Users, Search, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { formatDateRu } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
});

const roleLabels: Record<string, string> = {
  USER: "Пользователь",
  MODERATOR: "Модератор",
  ADMIN: "Администратор",
};

const roleColors: Record<string, string> = {
  USER: "bg-gray-100 text-gray-700",
  MODERATOR: "bg-blue-100 text-blue-700",
  ADMIN: "bg-red-100 text-red-700",
};

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useSWR(
    `/api/admin/users?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`,
    fetcher
  );

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    mutate(`/api/admin/users?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-12 animate-pulse rounded bg-secondary" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Пользователи
        </h1>
        <p className="text-muted-foreground">Управление пользователями платформы</p>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или email..."
            className="pl-10"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch}>Найти</Button>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {data?.users?.map((user: {
          id: string;
          name: string;
          email: string;
          image: string | null;
          role: string;
          createdAt: string;
          _count: { channels: number; playlists: number; comments: number; likedVideos: number; viewHistory: number };
        }) => (
          <Link key={user.id} href={`/admin/users/${user.id}`}>
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar
                  src={user.image || undefined}
                  fallback={user.name?.[0] || "U"}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{user.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[user.role] || roleColors.USER}`}>
                      {roleLabels[user.role] || user.role}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{user._count.channels} каналов</span>
                  <span>{user._count.comments} комментариев</span>
                  <span className="hidden lg:inline">{formatDateRu(user.createdAt)}</span>
                </div>
                <select
                  value={user.role}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="text-sm rounded border bg-background px-2 py-1 cursor-pointer"
                >
                  <option value="USER">Пользователь</option>
                  <option value="MODERATOR">Модератор</option>
                  <option value="ADMIN">Администратор</option>
                </select>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Страница {page} из {data.pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
