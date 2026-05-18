"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { BookOpen, Plus, Clock, Users, FileText, HelpCircle, MoreVertical, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-yellow-100 text-yellow-700",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликован",
  ARCHIVED: "В архиве",
};

export default function StudioCourses() {
  const { data, isLoading } = useSWR("/api/courses?page=1&limit=50", fetcher);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, status: "DRAFT" }),
    });
    if (res.ok) {
      setNewTitle("");
      mutate("/api/courses?page=1&limit=50");
    }
    setCreating(false);
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Удалить курс?")) return;
    const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
    if (res.ok) {
      mutate("/api/courses?page=1&limit=50");
    }
  };

  const handleStatusChange = async (courseId: string, status: string) => {
    await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    mutate("/api/courses?page=1&limit=50");
  };

  const courses = data?.courses || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Курсы</h1>
          <p className="text-muted-foreground">Управление курсами и учебными материалами</p>
        </div>
      </div>

      {/* Quick Create */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Создать новый курс</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Название курса..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="flex-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Link
              href="/studio/courses/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Создать
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Course List */}
      {isLoading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>У вас пока нет курсов</p>
          <Link
            href="/studio/courses/new"
            className="text-primary hover:underline text-sm mt-2 inline-block"
          >
            Создать первый курс
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: any) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-2">{course.title}</CardTitle>
                  <div className="relative">
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_COLORS[course.status]
                  }`}
                >
                  {STATUS_LABELS[course.status]}
                </span>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{course._count?.lessons || 0} уроков</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{course._count?.enrollments || 0} студентов</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{course._count?.assignments || 0} заданий</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>{course._count?.quizzes || 0} тестов</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/studio/courses/${course.id}`}
                    className="flex-1 text-center px-3 py-1.5 text-sm rounded-md border hover:bg-accent transition-colors"
                  >
                    Редактировать
                  </Link>
                  <Link
                    href={`/studio/courses/${course.id}/grades`}
                    className="flex-1 text-center px-3 py-1.5 text-sm rounded-md border hover:bg-accent transition-colors"
                  >
                    Оценки
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
