"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle, Clock, FileText, HelpCircle, Video, ArrowLeft } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  lessonType: "VIDEO" | "TEXT" | "QUIZ" | "ASSIGNMENT";
  position: number;
  duration: number | null;
  videoId: string | null;
  video: { id: string; title: string; duration: number | null; thumbnailKey: string | null } | null;
}

interface CourseData {
  id: string;
  title: string;
  description: string | null;
  teacherName: string | null;
  lessons: Lesson[];
}

interface Translations {
  backToCatalog: string;
  lessons: string;
  video: string;
  text: string;
  quiz: string;
  assignment: string;
  startLesson: string;
  completed: string;
  notEnrolled: string;
  enrollNow: string;
}

export function LearnClient({
  course,
  completedLessonIds,
  t,
}: {
  course: CourseData;
  completedLessonIds: string[];
  t: Translations;
}) {
  const [activeLessonId, setActiveLessonId] = useState<string | null>(course.lessons[0]?.id || null);

  const activeLesson = course.lessons.find((l) => l.id === activeLessonId);
  const completedSet = new Set(completedLessonIds);

  const lessonTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Video className="h-4 w-4" />;
      case "TEXT":
        return <FileText className="h-4 w-4" />;
      case "QUIZ":
        return <HelpCircle className="h-4 w-4" />;
      case "ASSIGNMENT":
        return <BookOpen className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const lessonTypeLabel = (type: string) => {
    switch (type) {
      case "VIDEO":
        return t.video;
      case "TEXT":
        return t.text;
      case "QUIZ":
        return t.quiz;
      case "ASSIGNMENT":
        return t.assignment;
      default:
        return type;
    }
  };

  const progress = course.lessons.length > 0
    ? Math.round((completedLessonIds.length / course.lessons.length) * 100)
    : 0;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Lesson list */}
      <div className="w-80 border-r bg-card overflow-y-auto">
        <div className="p-4 border-b">
          <Link href={`/courses/${course.id}`}>
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t.backToCatalog}
            </Button>
          </Link>
          <h2 className="font-semibold text-lg line-clamp-2">{course.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {course.lessons.length} {t.lessons} &middot; {progress}% {t.completed}
          </p>
          {/* Progress bar */}
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="p-2">
          {course.lessons.map((lesson, index) => {
            const isCompleted = completedSet.has(lesson.id);
            const isActive = lesson.id === activeLessonId;

            return (
              <button
                key={lesson.id}
                onClick={() => setActiveLessonId(lesson.id)}
                className={`w-full text-left p-3 rounded-lg mb-1 flex items-center gap-3 transition-colors ${
                  isActive
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted"
                }`}
              >
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <span className="h-5 w-5 flex items-center justify-center text-sm text-muted-foreground">
                      {index + 1}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {lessonTypeIcon(lesson.lessonType)}
                    <span className="text-sm font-medium truncate">{lesson.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {lessonTypeLabel(lesson.lessonType)}
                    </span>
                    {lesson.duration && (
                      <>
                        <span className="text-xs text-muted-foreground">&middot;</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {Math.round(lesson.duration / 60)}m
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {activeLesson ? (
          <div className="p-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  {lessonTypeIcon(activeLesson.lessonType)}
                  <span className="text-sm text-muted-foreground">
                    {lessonTypeLabel(activeLesson.lessonType)}
                  </span>
                </div>
                <CardTitle>{activeLesson.title}</CardTitle>
                {activeLesson.description && (
                  <p className="text-muted-foreground">{activeLesson.description}</p>
                )}
              </CardHeader>
              <CardContent>
                {activeLesson.lessonType === "VIDEO" && activeLesson.videoId && (
                  <div className="aspect-video bg-black rounded-lg">
                    <iframe
                      src={`/embed/${activeLesson.videoId}`}
                      className="w-full h-full rounded-lg"
                      allowFullScreen
                      allow="autoplay; encrypted-media"
                    />
                  </div>
                )}
                {activeLesson.lessonType === "TEXT" && (
                  <div className="prose max-w-none">
                    <p>{activeLesson.description || t.startLesson}</p>
                  </div>
                )}
                {(activeLesson.lessonType === "QUIZ" || activeLesson.lessonType === "ASSIGNMENT") && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{t.startLesson}</p>
                    <Button className="mt-4">
                      {activeLesson.lessonType === "QUIZ" ? t.quiz : t.assignment}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">{t.startLesson}</p>
          </div>
        )}
      </div>
    </div>
  );
}
