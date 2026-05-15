import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.subscription.deleteMany({
    where: {
      subscriberId: session.user.id,
      channelId: params.channelId,
    },
  });

  return NextResponse.json({ success: true });
}
