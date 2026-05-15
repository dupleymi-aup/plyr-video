import { prisma } from "./prisma";

export async function validateInvitationCode(code: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  const envCode = process.env.TEACHER_INVITATION_CODE;
  if (envCode && code === envCode) {
    return { valid: true };
  }

  const invitationCode = await prisma.invitationCode.findUnique({
    where: { code },
  });

  if (!invitationCode) {
    return { valid: false, error: "Invalid invitation code" };
  }

  if (!invitationCode.isActive) {
    return { valid: false, error: "This invitation code has been deactivated" };
  }

  if (invitationCode.expiresAt && invitationCode.expiresAt < new Date()) {
    return { valid: false, error: "This invitation code has expired" };
  }

  if (invitationCode.maxUses !== null && invitationCode.usedCount >= invitationCode.maxUses) {
    return { valid: false, error: "This invitation code has reached its usage limit" };
  }

  return { valid: true };
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
