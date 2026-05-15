import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRoleAccess } from "@/lib/permissions";
import crypto from "crypto";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments = [];
  for (let s = 0; s < 3; s++) {
    let segment = "";
    for (let i = 0; i < 4; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return segments.join("-");
}

export async function GET(req: Request) {
  const session = await auth();
  const forbidden = checkRoleAccess(session?.user?.role, "ADMIN");
  if (forbidden) return forbidden;

  const codes = await prisma.invitationCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { usedBy: true },
      },
    },
  });

  return NextResponse.json(codes.map((c) => ({
    id: c.id,
    code: c.code,
    label: c.label,
    maxUses: c.maxUses,
    usedCount: c._count.usedBy,
    isActive: c.isActive,
    createdAt: c.createdAt,
    expiresAt: c.expiresAt,
  })));
}

export async function POST(req: Request) {
  const session = await auth();
  const forbidden = checkRoleAccess(session?.user?.role, "ADMIN");
  if (forbidden) return forbidden;

  const body = await req.json();
  const { label, maxUses, expiresAt } = body;

  const code = await prisma.invitationCode.create({
    data: {
      code: generateCode(),
      label: label || null,
      maxUses: maxUses ? parseInt(maxUses, 10) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: session?.user?.id || null,
    },
  });

  return NextResponse.json(code, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  const forbidden = checkRoleAccess(session?.user?.role, "ADMIN");
  if (forbidden) return forbidden;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Code ID is required" }, { status: 400 });
  }

  await prisma.invitationCode.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
