import { prisma } from "./prisma";
import { NotificationType } from "@prisma/client";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  content: string;
  videoId?: string | null;
  channelId?: string | null;
  commentId?: string | null;
  assignmentId?: string | null;
  quizId?: string | null;
  courseId?: string | null;
}

export async function createNotification(data: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      content: data.content,
      videoId: data.videoId ?? null,
      channelId: data.channelId ?? null,
      commentId: data.commentId ?? null,
      assignmentId: data.assignmentId ?? null,
      quizId: data.quizId ?? null,
      courseId: data.courseId ?? null,
    },
  });
}

export async function hasReminderBeenSent(data: {
  userId: string;
  itemId: string;
  itemType: string;
  reminderType: string;
  interval: string;
}): Promise<boolean> {
  const existing = await prisma.reminderSent.findUnique({
    where: {
      userId_itemId_itemType_reminderType_interval: {
        userId: data.userId,
        itemId: data.itemId,
        itemType: data.itemType,
        reminderType: data.reminderType,
        interval: data.interval,
      },
    },
  });
  return !!existing;
}

export async function markReminderSent(data: {
  userId: string;
  itemId: string;
  itemType: string;
  reminderType: string;
  interval: string;
}) {
  return prisma.reminderSent.create({
    data,
  });
}
