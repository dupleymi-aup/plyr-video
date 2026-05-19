import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { checkRoleAccess, type Role } from "@/lib/permissions";
import { handleApiError } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const rawSort = searchParams.get("sort") || "publishedAt";
    const allowedSortFields = ["publishedAt", "viewCount", "title", "createdAt"] as const;
    const sort: (typeof allowedSortFields)[number] = allowedSortFields.includes(rawSort as typeof allowedSortFields[number])
      ? (rawSort as typeof allowedSortFields[number])
      : "publishedAt";

    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where: { status: "READY", visibility: "PUBLIC" },
        include: { channel: { select: { name: true, slug: true, avatar: true } } },
        orderBy: { [sort]: "desc" as const },
        skip,
        take: limit,
      }),
      prisma.video.count({ where: { status: "READY", visibility: "PUBLIC" } }),
    ]);

    return NextResponse.json({
      videos,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error, "videos-GET");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleError = checkRoleAccess(session.user.role as Role, "TEACHER");
    if (roleError) return roleError;

    const body = await request.json();
    const { title, description, channelId, visibility } = body;

    if (!title || !channelId) {
      return NextResponse.json({ error: "Title and channelId are required" }, { status: 400 });
    }

    const channel = await prisma.channel.findFirst({
      where: { id: channelId, ownerId: session.user.id },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const video = await prisma.video.create({
      data: { title, description, channelId, visibility: visibility || "PRIVATE", storageKey: "" },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    return handleApiError(error, "videos-POST");
  }
}
