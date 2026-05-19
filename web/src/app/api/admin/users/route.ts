import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user, session };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if ("error" in authResult) return authResult.error;

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const role = searchParams.get("role");
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (role && ["STUDENT", "TEACHER", "ADMIN"].includes(role)) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          banned: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              channels: true,
              playlists: true,
              comments: true,
              likedVideos: true,
              viewHistory: true,
            },
          },
        },
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error, "admin-users-GET");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if ("error" in authResult) return authResult.error;
    const { user: adminUser, session } = authResult;

    const body = await request.json();
    const { userId, role, banned } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: "You cannot modify your own account" }, { status: 400 });
    }

    if (role && role !== "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (targetUser?.role === "ADMIN" && adminCount <= 1) {
        return NextResponse.json({ error: "Cannot demote the last admin. Promote another user first." }, { status: 400 });
      }
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, banned: true, name: true, email: true },
    });

    const updateData: Record<string, unknown> = {};
    if (role && ["STUDENT", "TEACHER", "ADMIN"].includes(role)) {
      updateData.role = role;
    }
    if (typeof banned === "boolean") {
      updateData.banned = banned;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await prisma.user.update({ where: { id: userId }, data: updateData });

    const targetName = currentUser?.name || currentUser?.email || userId;
    const auditEntries = [];

    if (updateData.role !== undefined && currentUser) {
      auditEntries.push(
        prisma.auditLog.create({
          data: {
            action: "ROLE_CHANGED",
            targetId: userId,
            targetType: "User",
            oldValue: currentUser.role,
            newValue: updateData.role as string,
            details: `Role changed for ${targetName}: ${currentUser.role} -> ${updateData.role}`,
            adminId: adminUser.id,
          },
        })
      );
    }

    if (typeof updateData.banned === "boolean" && currentUser) {
      auditEntries.push(
        prisma.auditLog.create({
          data: {
            action: updateData.banned ? "USER_BANNED" : "USER_UNBANNED",
            targetId: userId,
            targetType: "User",
            oldValue: String(currentUser.banned),
            newValue: String(updateData.banned),
            details: `${updateData.banned ? "Banned" : "Unbanned"} ${targetName}`,
            adminId: adminUser.id,
          },
        })
      );
    }

    if (auditEntries.length > 0) {
      await prisma.$transaction(auditEntries);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "admin-users-PATCH");
  }
}
