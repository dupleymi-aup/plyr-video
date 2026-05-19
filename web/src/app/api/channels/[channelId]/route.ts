import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
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
  } catch (error) {
    return handleApiError(error, "channel");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channelId } = await params;
    const body = await request.json();

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description, avatar, banner, isVerified, socialLinks, contactEmail } = body;

    const updated = await prisma.channel.update({
      where: { id: channelId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(avatar !== undefined && { avatar }),
        ...(banner !== undefined && { banner }),
        ...(isVerified !== undefined && session.user.role === "ADMIN" && { isVerified }),
        ...(socialLinks !== undefined && { socialLinks }),
        ...(contactEmail !== undefined && { contactEmail }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "channel");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channelId } = await params;

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.channel.delete({ where: { id: channelId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "channel");
  }
}
