import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ videos: [], channels: [] });
  }

  const [videos, channels] = await Promise.all([
    prisma.video.findMany({
      where: {
        AND: [
          { status: "READY", visibility: "PUBLIC" },
          {
            OR: [
              { title: { contains: query } },
              { description: { contains: query } },
            ],
          },
        ],
      },
      include: {
        channel: { select: { name: true, avatar: true } },
      },
      take: 20,
    }),
    prisma.channel.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      },
      take: 10,
    }),
  ]);

  return NextResponse.json({ videos, channels });
}
