import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Prevent admin from deleting themselves
  if (params.userId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  // Prevent deleting the last admin
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  const targetUser = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { role: true },
  });
  if (targetUser?.role === "ADMIN" && adminCount <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the last admin. Promote another user first." },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id: params.userId } });

  return NextResponse.json({ success: true });
}
