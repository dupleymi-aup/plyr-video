"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft, BookOpen, Users, FileText, HelpCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/analytics/stat-card";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminCourseDetail() {
  const t = useTranslations("courseDetail");
  const tCommon = useTranslations("common");
  const params = useParams();
  const courseId = params?.courseId as string;

  const { data: course, isLoading } = useSWR(
    courseId ? `/api/courses/${courseId}` : null,
    fetcher
  );

  const { data: enrollments } = useSWR(
    courseId ? `/api/courses/${courseId}/enrollments` : null,
    fetcher
  );

  const { data: grades } = useSWR(
    courseId ? `/api/courses/${courseId}/grades` : null,
    fetcher
  );

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">{tCommon("loading")}</div>;
  }

  if (!course) {
    return <div className="p-6 text-muted-foreground">{t("courseNotFound")}</div>;
  }

  const lessons = course.lessons || [];
  const enrollmentCount = course._count?.enrollments || 0;
  const assignmentCount = course._count?.assignments || 0;
  const quizCount = course._count?.quizzes || 0;

  const statusLabels: Record<string, string> = {
    DRAFT: t("draft"),
    PUBLISHED: t("published"),
    ARCHIVED: t("archived"),
  };

  const lessonTypeLabels: Record<string, string> = {
    VIDEO: t("video"),
    TEXT: t("text"),
    QUIZ: t("quiz"),
    ASSIGNMENT: t("assignment"),
  };

  return (
    <div>
      <Link
        href="/admin/courses"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToCourses")}
      </Link>

      {/* Course Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              course.status === "PUBLISHED"
                ? "bg-green-100 text-green-700"
                : course.status === "ARCHIVED"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {statusLabels[course.status]}
          </span>
        </div>
        {course.description && (
          <p className="text-muted-foreground">{course.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          {t("teacher")}: {course.teacher.name || course.teacher.email}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          label={t("lessons")}
          value={lessons.length}
          icon={Clock}
          color="text-blue-600"
        />
        <StatCard
          label={t("students")}
          value={enrollmentCount}
          icon={Users}
          color="text-green-600"
        />
        <StatCard
          label={t("assignments")}
          value={assignmentCount}
          icon={FileText}
          color="text-purple-600"
        />
        <StatCard
          label={t("quizzes")}
          value={quizCount}
          icon={HelpCircle}
          color="text-amber-600"
        />
      </div>

      {/* Lessons */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{t("lessons")}</CardTitle>
        </CardHeader>
        <CardContent>
          {lessons.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">#</th>
                  <th className="text-left px-4 py-2 font-medium">{t("name")}</th>
                  <th className="text-left px-4 py-2 font-medium">{t("type")}</th>
                  <th className="text-left px-4 py-2 font-medium">{t("video")}</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson: any, i: number) => (
                  <tr key={lesson.id} className="border-t">
                    <td className="px-4 py-2">{i + 1}</td>
                    <td className="px-4 py-2 font-medium">{lesson.title}</td>
                    <td className="px-4 py-2">{lessonTypeLabels[lesson.lessonType]}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {lesson.video?.title || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">{t("noLessons")}</div>
          )}
        </CardContent>
      </Card>

      {/* Enrollments & Grades */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("enrolledStudents")}</CardTitle>
          </CardHeader>
          <CardContent>
            {enrollments && enrollments.length > 0 ? (
              <div className="space-y-2">
                {enrollments.map((e: any) => (
                  <div key={e.id} className="flex justify-between py-2 border-b last:border-0">
                    <span className="font-medium">
                      {e.student.name || e.student.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(e.enrolledAt).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t("noEnrolledStudents")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("grades")}</CardTitle>
          </CardHeader>
          <CardContent>
            {grades && grades.length > 0 ? (
              <div className="space-y-2">
                {grades.map((g: any) => (
                  <div key={g.id} className="flex justify-between py-2 border-b last:border-0">
                    <span className="font-medium">
                      {g.enrollment.student.name || g.enrollment.student.email}
                    </span>
                    <span
                      className={`font-medium ${
                        g.value >= 80
                          ? "text-green-600"
                          : g.value >= 60
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {g.value}{g.scale === "PERCENT" ? "%" : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t("noGrades")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
