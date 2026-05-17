import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const history = await prisma.videoView.findMany({
    where: { userId: session.user.id },
    include: {
      video: {
        select: {
          id: true,
          title: true,
          thumbnailKey: true,
          duration: true,
          viewCount: true,
          channel: { select: { name: true, slug: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ history });
}
