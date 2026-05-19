import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateSlug } from "@/lib/utils";
import { checkRoleAccess, type Role } from "@/lib/permissions";
import { handleApiError } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [channels, total] = await Promise.all([
      prisma.channel.findMany({
        include: {
          _count: {
            select: {
              videos: true,
              subscriptions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.channel.count(),
    ]);

    return NextResponse.json({
      channels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error, "channels");
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
  } catch (error) {
    return handleApiError(error, "channels");
  }
}
