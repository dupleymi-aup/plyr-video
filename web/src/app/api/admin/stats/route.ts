import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsers24h,
    newUsers7d,
    totalVideos,
    newVideos24h,
    totalViews,
    views24h,
    totalComments,
    newComments24h,
    registrationsByDay,
    viewsByDay,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: last24h } } }),
    prisma.user.count({ where: { createdAt: { gte: last7d } } }),
    prisma.video.count(),
    prisma.video.count({ where: { createdAt: { gte: last24h } } }),
    prisma.video.aggregate({ _sum: { viewCount: true } }),
    prisma.videoView.count({ where: { createdAt: { gte: last24h } } }),
    prisma.comment.count(),
    prisma.comment.count({ where: { createdAt: { gte: last24h } } }),
    // Registrations by day (last 7 days)
    prisma.$queryRaw`
      SELECT strftime('%Y-%m-%d', createdAt) as day, COUNT(*) as count
      FROM User
      WHERE createdAt >= datetime('now', '-7 days')
      GROUP BY day
      ORDER BY day
    `,
    // Views by day (last 7 days)
    prisma.$queryRaw`
      SELECT strftime('%Y-%m-%d', createdAt) as day, COUNT(*) as count
      FROM VideoView
      WHERE createdAt >= datetime('now', '-7 days')
      GROUP BY day
      ORDER BY day
    `,
  ]);

  return NextResponse.json({
    totalUsers,
    newUsers24h,
    newUsers7d,
    totalVideos,
    newVideos24h,
    totalViews: totalViews._sum.viewCount || 0,
    views24h,
    totalComments,
    newComments24h,
    registrationsByDay,
    viewsByDay,
  });
}
