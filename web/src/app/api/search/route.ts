import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const MAX_QUERY_LENGTH = 200;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawQuery = searchParams.get("q");

  if (!rawQuery) {
    return NextResponse.json({ videos: [], channels: [] });
  }

  const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);
  if (query.length < 2) {
    return NextResponse.json({ videos: [], channels: [], error: "Search query must be at least 2 characters" });
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
