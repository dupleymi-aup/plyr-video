import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { userId } = await params;

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Prevent deleting the last admin
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true, email: true },
    });
    if (targetUser?.role === "ADMIN" && adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last admin. Promote another user first." },
        { status: 400 }
      );
    }

    // Audit log before deletion
    const targetName = targetUser?.name || targetUser?.email || userId;
    await prisma.auditLog.create({
      data: {
        action: "USER_DELETED",
        targetId: userId,
        targetType: "User",
        details: `Deleted user ${targetName} (was ${targetUser?.role})`,
        adminId: session.user.id,
      },
    });

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin users delete API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
