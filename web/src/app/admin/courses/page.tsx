"use client";

import useSWR from "swr";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { BookOpen } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminCourses() {
  const t = useTranslations("adminCourses");
  const tCommon = useTranslations("common");
  const { data, isLoading, error } = useSWR("/api/courses?page=1&limit=50", fetcher);
  const courses = data?.courses || [];

  if (error) return <div className="text-red-600 p-6">{tCommon("error") || "Ошибка загрузки"}</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">{tCommon("loading")}</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t("noCourses")}</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t("name")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("teacher")}</th>
                <th className="text-left px-4 py-3 font-medium">{tCommon("status")}</th>
                <th className="text-right px-4 py-3 font-medium">{t("lessons")}</th>
                <th className="text-right px-4 py-3 font-medium">{t("students")}</th>
                <th className="text-center px-4 py-3 font-medium">{tCommon("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course: any) => (
                <tr key={course.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{course.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {course.teacher.name || course.teacher.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        course.status === "PUBLISHED"
                          ? "bg-green-100 text-green-700"
                          : course.status === "ARCHIVED"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {course.status === "PUBLISHED"
                        ? t("published")
                        : course.status === "ARCHIVED"
                        ? t("archived")
                        : t("draft")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{course._count?.lessons || 0}</td>
                  <td className="px-4 py-3 text-right">{course._count?.enrollments || 0}</td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="text-primary hover:underline text-xs"
                    >
                      {t("details")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
