import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-errors";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

// Max 3 requests per 10 minutes per IP
const LIMIT = { limit: 3, windowMs: 10 * 60 * 1000 };

export async function POST(req: Request) {
  const ip = getClientIp(req.headers as unknown as Headers);
  const limit = rateLimit(`forgot-password:${ip}`, LIMIT.limit, LIMIT.windowMs);

  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user || !user.passwordHash) {
      return NextResponse.json({ success: true });
    }

    // Generate token and expiry (1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    await sendPasswordResetEmail({
      to: email,
      name: user.name || "User",
      resetUrl,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "forgot-password");
  }
}
