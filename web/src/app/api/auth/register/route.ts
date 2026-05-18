import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import { validateAndConsumeInvitationCode } from "@/lib/invitation-codes";
import { handleApiError } from "@/lib/api-errors";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Max 5 registration attempts per 10 minutes per IP
const REGISTER_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };

export async function POST(req: Request) {
  const ip = getClientIp(req.headers as unknown as Headers);
  const limit = rateLimit(`register:${ip}`, REGISTER_LIMIT.limit, REGISTER_LIMIT.windowMs);

  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    );
  }
  try {
    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const { name, email, password, role, invitationCode } = validated.data;

    if (role === "ADMIN") {
      return NextResponse.json(
        { error: "Admin accounts cannot be self-registered" },
        { status: 403 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
        role: role || "STUDENT",
      },
    });

    if (role === "TEACHER" && invitationCode) {
      const result = await validateAndConsumeInvitationCode(invitationCode, user.id);
      if (!result.success) {
        // Rollback: delete the user since code consumption failed
        await prisma.user.delete({ where: { id: user.id } });
        return NextResponse.json(
          { error: result.error || "Invalid invitation code" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { message: "Account created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "register");
  }
}
