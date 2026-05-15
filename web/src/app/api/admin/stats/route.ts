import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totalUsers, totalVideos, totalChannels, bannedUsers, studentCount, teacherCount, adminCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.video.count(),
      prisma.channel.count(),
      prisma.user.count({ where: { banned: true } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
    ]);

  return NextResponse.json({
    totalUsers,
    totalVideos,
    totalChannels,
    bannedUsers,
    studentCount,
    teacherCount,
    adminCount,
  });
}
