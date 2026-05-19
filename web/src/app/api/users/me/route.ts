import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        bio: true,
        location: true,
        website: true,
        theme: true,
        language: true,
        banned: true,
        createdAt: true,
        updatedAt: true,
        channels: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            createdAt: true,
            _count: {
              select: {
                videos: true,
                subscriptions: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalViews = await prisma.video.aggregate({
      where: {
        channelId: {
          in: user.channels.map((ch) => ch.id),
        },
      },
      _sum: { viewCount: true },
    });

    return NextResponse.json({
      ...user,
      totalViews: totalViews._sum.viewCount || 0,
    });
  } catch (error) {
    return handleApiError(error, "users-me");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, bio, image, location, website, theme, language } = body;

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(image !== undefined && { image }),
        ...(location !== undefined && { location }),
        ...(website !== undefined && { website }),
        ...(theme !== undefined && { theme }),
        ...(language !== undefined && { language }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        bio: true,
        location: true,
        website: true,
        theme: true,
        language: true,
        banned: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "users-me");
  }
}
