import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const name = searchParams.get("name");

  if (!email && !name) {
    return NextResponse.json({ error: "email or name query param is required" }, { status: 400 });
  }

  const where: Record<string, unknown> = {
    role: "STUDENT",
    banned: false,
  };

  if (email) {
    where.email = { contains: email, mode: "insensitive" };
  } else if (name) {
    where.name = { contains: name, mode: "insensitive" };
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
    take: 20,
  });

  return NextResponse.json(users);
}
