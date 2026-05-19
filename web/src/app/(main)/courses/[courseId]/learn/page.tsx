import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LearnClient } from "./client";

export default async function LearnPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const session = await auth();
  const t = await getTranslations("learn");

  if (!session?.user) {
    notFound();
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      teacher: { select: { id: true, name: true } },
      lessons: {
        orderBy: { position: "asc" },
        include: {
          video: { select: { id: true, title: true, duration: true, thumbnailKey: true } },
        },
      },
      enrollments: { where: { studentId: session.user.id } },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course || course.status !== "PUBLISHED") {
    notFound();
  }

  // Auto-enroll if not already enrolled
  const isEnrolled = course.enrollments.length > 0;
  if (!isEnrolled) {
    await prisma.courseEnrollment.create({
      data: { courseId, studentId: session.user.id },
    });
  }

  // Get lesson completions
  const completions = await prisma.lessonCompletion.findMany({
    where: {
      lessonId: { in: course.lessons.map((l) => l.id) },
      studentId: session.user.id,
    },
    select: { lessonId: true },
  });
  const completedLessonIds = new Set(completions.map((c) => c.lessonId));

  return (
    <LearnClient
      course={{
        id: course.id,
        title: course.title,
        description: course.description,
        teacherName: course.teacher.name,
        lessons: course.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          description: l.description,
          lessonType: l.lessonType,
          position: l.position,
          duration: l.duration,
          videoId: l.videoId,
          video: l.video
            ? {
                id: l.video.id,
                title: l.video.title,
                duration: l.video.duration,
                thumbnailKey: l.video.thumbnailKey,
              }
            : null,
        })),
      }}
      completedLessonIds={Array.from(completedLessonIds)}
      t={{
        backToCatalog: t("backToCatalog"),
        lessons: t("lessons"),
        video: t("video"),
        text: t("text"),
        quiz: t("quiz"),
        assignment: t("assignment"),
        startLesson: t("startLesson"),
        completed: t("completed"),
        notEnrolled: t("notEnrolled"),
        enrollNow: t("enrollNow"),
      }}
    />
  );
}
