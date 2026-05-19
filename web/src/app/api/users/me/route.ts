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
      include: {
        channels: {
          include: {
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
      passwordHash: undefined,
      twoFactorSecret: undefined,
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
    });

    return NextResponse.json({
      ...updated,
      passwordHash: undefined,
      twoFactorSecret: undefined,
    });
  } catch (error) {
    return handleApiError(error, "users-me");
  }
}
