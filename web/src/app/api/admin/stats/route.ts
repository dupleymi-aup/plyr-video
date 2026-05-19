import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { TotalSecondsResult } from "@/types/analytics";
import { handleApiError } from "@/lib/api-errors";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if ("error" in authResult) return authResult.error;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

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
      newUsers24h,
      newUsers7d,
      newVideos24h,
      views24h,
      newComments24h,
      registrationsByDay,
      viewsByDay,
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
      prisma.user.count({ where: { createdAt: { gte: last24h } } }),
      prisma.user.count({ where: { createdAt: { gte: last7d } } }),
      prisma.video.count({ where: { createdAt: { gte: last24h } } }),
      prisma.videoView.count({ where: { createdAt: { gte: last24h } } }),
      prisma.comment.count({ where: { createdAt: { gte: last24h } } }),
      prisma.$queryRaw`
        SELECT strftime('%Y-%m-%d', createdAt) as day, COUNT(*) as count
        FROM User
        WHERE createdAt >= datetime('now', '-7 days')
        GROUP BY day
        ORDER BY day
      `,
      prisma.$queryRaw`
        SELECT strftime('%Y-%m-%d', createdAt) as day, COUNT(*) as count
        FROM VideoView
        WHERE createdAt >= datetime('now', '-7 days')
        GROUP BY day
        ORDER BY day
      `,
    ]);

    const totalViewsResult = await prisma.video.aggregate({ _sum: { viewCount: true } });
    const totalViews = totalViewsResult._sum.viewCount || 0;

    const watchTimeResult = await prisma.$queryRaw<[{ totalSeconds: number }]>`
      SELECT COALESCE(SUM(watchedSeconds), 0) as totalSeconds FROM VideoView
    `;
    const totalWatchSeconds = Number((watchTimeResult as TotalSecondsResult[])[0]?.totalSeconds ?? 0);

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
      totalViews,
      newUsers24h,
      newUsers7d,
      newVideos24h,
      views24h,
      newComments24h,
      registrationsByDay,
      viewsByDay,
    });
  } catch (error) {
    return handleApiError(error, "admin-stats");
  }
}
