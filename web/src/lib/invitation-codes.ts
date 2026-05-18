import { prisma } from "./prisma";
import type { InvitationCode } from "@prisma/client";

/**
 * Check if an invitation code is valid (active, not expired, under usage limit).
 */
function isCodeValid(code: InvitationCode): { valid: true } | { valid: false; error: string } {
  if (!code.isActive) {
    return { valid: false, error: "DEACTIVATED" };
  }
  if (code.expiresAt && code.expiresAt < new Date()) {
    return { valid: false, error: "EXPIRED" };
  }
  if (code.maxUses !== null && code.usedCount >= code.maxUses) {
    return { valid: false, error: "MAX_USES_REACHED" };
  }
  return { valid: true };
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CODE: "Invalid invitation code",
  DEACTIVATED: "This invitation code has been deactivated",
  EXPIRED: "This invitation code has expired",
  MAX_USES_REACHED: "This invitation code has reached its usage limit",
};

export async function validateAndConsumeInvitationCode(code: string, userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const envCode = process.env.TEACHER_INVITATION_CODE;
  if (envCode && code === envCode) {
    return { success: true };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const invitationCode = await tx.invitationCode.findUnique({ where: { code } });

      if (!invitationCode) {
        return { success: false, error: ERROR_MESSAGES.INVALID_CODE };
      }

      const check = isCodeValid(invitationCode);
      if (!check.valid) {
        return { success: false, error: ERROR_MESSAGES[check.error] };
      }

      await tx.invitationCode.update({
        where: { code },
        data: {
          usedCount: { increment: 1 },
          usedBy: { connect: { id: userId } },
        },
      });

      return { success: true };
    });
  } catch {
    return { success: false, error: "Failed to process invitation code" };
  }
}

export async function validateInvitationCode(code: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  const envCode = process.env.TEACHER_INVITATION_CODE;
  if (envCode && code === envCode) {
    return { valid: true };
  }

  const invitationCode = await prisma.invitationCode.findUnique({ where: { code } });

  if (!invitationCode) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_CODE };
  }

  const check = isCodeValid(invitationCode);
  return check.valid
    ? { valid: true }
    : { valid: false, error: ERROR_MESSAGES[check.error] };
}

export async function consumeInvitationCode(code: string, userId: string): Promise<void> {
  const envCode = process.env.TEACHER_INVITATION_CODE;
  if (envCode && code === envCode) {
    return;
  }

  await prisma.$transaction([
    prisma.invitationCode.update({
      where: { code },
      data: { usedCount: { increment: 1 } },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { registeredWithCode: { connect: { code } } },
    }),
  ]);
}
