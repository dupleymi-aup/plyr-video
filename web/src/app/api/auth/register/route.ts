import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import { validateInvitationCode, consumeInvitationCode } from "@/lib/invitation-codes";

export async function POST(req: Request) {
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

    if (role === "TEACHER") {
      const validation = await validateInvitationCode(invitationCode || "");
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || "Invalid invitation code" },
          { status: 400 }
        );
      }
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
      await consumeInvitationCode(invitationCode, user.id);
    }

    return NextResponse.json(
      { message: "Account created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
