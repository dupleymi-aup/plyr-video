import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { checkRoleAccess, type Role } from "@/lib/permissions";
import { z } from "zod";
import { handleApiError } from "@/lib/api-errors";

const videoUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters").optional(),
  description: z.string().max(5000, "Description must be less than 5000 characters").optional().nullable(),
  visibility: z.enum(["PRIVATE", "UNLISTED", "PUBLIC"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
            banner: true,
            isVerified: true,
            _count: {
              select: { subscriptions: true },
            },
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Don't show private videos to non-owners
    if (video.visibility === "PRIVATE") {
      const session = await auth();
      if (!session?.user?.id || video.channel.ownerId !== session.user.id) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }
    }

    return NextResponse.json(video);
  } catch (error) {
    return handleApiError(error, "video");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleError = checkRoleAccess(session.user.role as Role, "TEACHER");
    if (roleError) return roleError;

    const body = await request.json();
    const validation = videoUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { videoId } = await params;

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { channel: true },
    });

    if (!video || video.channel.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const updated = await prisma.video.update({
      where: { id: videoId },
      data: validation.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "video");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleError = checkRoleAccess(session.user.role as Role, "TEACHER");
    if (roleError) return roleError;

    const { videoId } = await params;

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { channel: true },
    });

    if (!video || video.channel.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    await prisma.video.delete({ where: { id: videoId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "video");
  }
}
