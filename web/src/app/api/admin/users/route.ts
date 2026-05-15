import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, role, banned } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Prevent admin from modifying their own account
  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot modify your own account" },
      { status: 400 }
    );
  }

  // Prevent demoting the last admin
  if (role && role !== "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (targetUser?.role === "ADMIN" && adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot demote the last admin. Promote another user first." },
        { status: 400 }
      );
    }
  }

  // Fetch current values for audit logging
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
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  // Audit logging
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
          details: `Role changed for ${targetName}: ${currentUser.role} → ${updateData.role}`,
          adminId: session.user.id,
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
          adminId: session.user.id,
        },
      })
    );
  }

  if (auditEntries.length > 0) {
    await prisma.$transaction(auditEntries);
  }

  return NextResponse.json({ success: true });
}
