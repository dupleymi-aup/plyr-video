import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where: { subscriberId: session.user.id },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.subscription.count({ where: { subscriberId: session.user.id } }),
  ]);

  return NextResponse.json({
    subscriptions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { channelId } = body;

  if (!channelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 });
  }

  try {
    const subscription = await prisma.subscription.create({
      data: {
        subscriberId: session.user.id,
        channelId,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
    }
    throw error;
  }
}
