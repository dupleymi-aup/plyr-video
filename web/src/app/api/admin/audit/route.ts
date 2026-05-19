import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRoleAccess } from "@/lib/permissions";
import { handleApiError } from "@/lib/api-errors";

export async function GET(req: Request) {
  try {
  const session = await auth();
  const forbidden = checkRoleAccess(session?.user?.role, "ADMIN");
  if (forbidden) return forbidden;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const action = searchParams.get("action");

  const where: Record<string, unknown> = {};
  if (action) {
    where.action = action;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        action: true,
        targetId: true,
        targetType: true,
        oldValue: true,
        newValue: true,
        details: true,
        createdAt: true,
        admin: {
          select: { name: true, email: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return handleApiError(error, "admin-audit");
  }
}
