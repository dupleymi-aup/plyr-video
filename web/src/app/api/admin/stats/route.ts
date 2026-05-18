import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      totalUsers,
      totalVideos,
      totalChannels,
      bannedUsers,
      studentCount,
      teacherCount,
      adminCount,
      totalComments,
      totalLikes,
      totalCourses,
      totalEnrollments,
      totalGrades,
      totalSubmissions,
      totalQuizAttempts,
      totalLessonCompletions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.video.count(),
      prisma.channel.count(),
      prisma.user.count({ where: { banned: true } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.comment.count(),
      prisma.likedVideo.count(),
      prisma.course.count(),
      prisma.courseEnrollment.count(),
      prisma.grade.count(),
      prisma.submission.count(),
      prisma.quizAttempt.count(),
      prisma.lessonCompletion.count(),
    ]);

    const watchTimeResult = await prisma.$queryRaw<[{ totalSeconds: number }]>`
      SELECT COALESCE(SUM(watchedSeconds), 0) as totalSeconds FROM VideoView
    `;
    const totalWatchSeconds = Number((watchTimeResult[0] as any).totalSeconds ?? 0);

    return NextResponse.json({
      totalUsers,
      totalVideos,
      totalChannels,
      bannedUsers,
      studentCount,
      teacherCount,
      adminCount,
      totalComments,
      totalLikes,
      totalCourses,
      totalEnrollments,
      totalGrades,
      totalSubmissions,
      totalQuizAttempts,
      totalLessonCompletions,
      totalWatchSeconds,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
