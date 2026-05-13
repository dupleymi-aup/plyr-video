import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateSlug } from "@/lib/utils";

export async function GET() {
  const channels = await prisma.channel.findMany({
    include: {
      _count: {
        select: {
          videos: true,
          subscriptions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(channels);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = generateSlug(name);

  // Check if slug is unique
  const existing = await prisma.channel.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Channel name already taken" }, { status: 400 });
  }

  const channel = await prisma.channel.create({
    data: {
      name,
      slug,
      description,
      ownerId: session.user.id,
    },
  });

  return NextResponse.json(channel, { status: 201 });
}
