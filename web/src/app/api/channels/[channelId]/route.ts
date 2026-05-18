import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: {
      videos: {
        where: { status: "READY", visibility: "PUBLIC" },
        orderBy: { publishedAt: "desc" },
        take: 20,
      },
      playlists: {
        where: { isPublic: true },
        take: 10,
      },
      _count: {
        select: {
          videos: { where: { status: "READY", visibility: "PUBLIC" } },
          subscriptions: true,
        },
      },
    },
  });

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  return NextResponse.json(channel);
}
