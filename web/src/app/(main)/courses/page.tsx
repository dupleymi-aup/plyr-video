"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BookOpen, Clock, Users } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CoursesPage() {
  const t = useTranslations("catalog");
  const { data, isLoading } = useSWR("/api/courses/public?page=1&limit=24", fetcher);

  const courses = data?.courses || [];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-muted" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t("noCourses")}</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course: CourseWithCounts) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

interface CourseWithCounts {
  id: string;
  title: string;
  description: string | null;
  thumbnailKey: string | null;
  status: string;
  teacher: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    lessons: number;
    enrollments: number;
  };
}

function CourseCard({ course }: { course: CourseWithCounts }) {
  const t = useTranslations("catalog");

  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-primary/40" />
          </div>
        </div>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base line-clamp-2">{course.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {/* Teacher */}
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={course.teacher.image || undefined} />
              <AvatarFallback className="text-xs">
                {course.teacher.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate">
              {course.teacher.name || "Неизвестен"}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{course._count.lessons} {t("lessons")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course._count.enrollments} {t("students")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
