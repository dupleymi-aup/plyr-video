import { prisma } from "@/lib/prisma";
import { createNotification, hasReminderBeenSent, markReminderSent } from "@/lib/notifications";
import { sendDeadlineEmail } from "@/lib/email";
import { addHours, addDays, isBefore, isAfter } from "date-fns";

const REMINDER_INTERVALS = [
  { label: "7d", fn: (d: Date) => addDays(d, -7) },
  { label: "3d", fn: (d: Date) => addDays(d, -3) },
  { label: "1d", fn: (d: Date) => addDays(d, -1) },
  { label: "1h", fn: (d: Date) => addHours(d, -1) },
];

const intervalLabels: Record<string, string> = {
  "7d": "7 дней",
  "3d": "3 дня",
  "1d": "24 часа",
  "1h": "1 час",
};

export async function processDeadlineReminders() {
  const now = new Date();
  let totalSent = 0;

  // Assignment reminders
  const assignments = await prisma.assignment.findMany({
    where: {
      dueDate: { not: null },
      course: { status: "PUBLISHED" },
    },
    include: {
      course: {
        include: {
          enrollments: { include: { student: true } },
        },
      },
    },
  });

  for (const assignment of assignments) {
    if (!assignment.dueDate) continue;

    for (const interval of REMINDER_INTERVALS) {
      const windowStart = interval.fn(assignment.dueDate);
      const windowEnd = addHours(windowStart, 2);

      if (isBefore(now, windowStart) || isAfter(now, windowEnd)) continue;

      for (const enrollment of assignment.course.enrollments) {
        const existingSubmission = await prisma.submission.findUnique({
          where: {
            assignmentId_studentId: {
              assignmentId: assignment.id,
              studentId: enrollment.studentId,
            },
          },
        });
        if (existingSubmission) continue;

        const prefs = await prisma.notificationPreference.findUnique({
          where: { userId: enrollment.studentId },
        });
        if (prefs && !prefs.assignmentReminder) continue;

        const alreadySent = await hasReminderBeenSent({
          userId: enrollment.studentId,
          itemId: assignment.id,
          itemType: "ASSIGNMENT",
          reminderType: "DUE_SOON",
          interval: interval.label,
        });
        if (alreadySent) continue;

        await createNotification({
          userId: enrollment.studentId,
          type: "ASSIGNMENT_DUE",
          content: `Задание "${assignment.title}" по курсу "${assignment.course.title}" необходимо сдать через ${intervalLabels[interval.label]}. Срок: ${assignment.dueDate.toLocaleDateString("ru-RU")}`,
          assignmentId: assignment.id,
          courseId: assignment.courseId,
        });

        if (prefs?.emailAssignment && enrollment.student.email) {
          await sendDeadlineEmail({
            to: enrollment.student.email,
            name: enrollment.student.name || "Студент",
            title: assignment.title,
            type: "assignment",
            dueDate: assignment.dueDate,
            courseTitle: assignment.course.title,
            interval: interval.label,
          });
        }

        await markReminderSent({
          userId: enrollment.studentId,
          itemId: assignment.id,
          itemType: "ASSIGNMENT",
          reminderType: "DUE_SOON",
          interval: interval.label,
        });
        totalSent++;
      }
    }
  }

  // Quiz reminders
  const quizzes = await prisma.quiz.findMany({
    where: {
      dueDate: { not: null },
      course: { status: "PUBLISHED" },
    },
    include: {
      course: {
        include: {
          enrollments: { include: { student: true } },
        },
      },
    },
  });

  for (const quiz of quizzes) {
    if (!quiz.dueDate) continue;

    for (const interval of REMINDER_INTERVALS) {
      const windowStart = interval.fn(quiz.dueDate);
      const windowEnd = addHours(windowStart, 2);

      if (isBefore(now, windowStart) || isAfter(now, windowEnd)) continue;

      for (const enrollment of quiz.course.enrollments) {
        const existingAttempt = await prisma.quizAttempt.findFirst({
          where: {
            quizId: quiz.id,
            studentId: enrollment.studentId,
          },
        });
        if (existingAttempt) continue;

        const prefs = await prisma.notificationPreference.findUnique({
          where: { userId: enrollment.studentId },
        });
        if (prefs && !prefs.quizReminder) continue;

        const alreadySent = await hasReminderBeenSent({
          userId: enrollment.studentId,
          itemId: quiz.id,
          itemType: "QUIZ",
          reminderType: "DUE_SOON",
          interval: interval.label,
        });
        if (alreadySent) continue;

        await createNotification({
          userId: enrollment.studentId,
          type: "QUIZ_DUE",
          content: `Тест "${quiz.title}" по курсу "${quiz.course.title}" необходимо пройти через ${intervalLabels[interval.label]}. Срок: ${quiz.dueDate.toLocaleDateString("ru-RU")}`,
          quizId: quiz.id,
          courseId: quiz.courseId,
        });

        if (prefs?.emailQuiz && enrollment.student.email) {
          await sendDeadlineEmail({
            to: enrollment.student.email,
            name: enrollment.student.name || "Студент",
            title: quiz.title,
            type: "quiz",
            dueDate: quiz.dueDate,
            courseTitle: quiz.course.title,
            interval: interval.label,
          });
        }

        await markReminderSent({
          userId: enrollment.studentId,
          itemId: quiz.id,
          itemType: "QUIZ",
          reminderType: "DUE_SOON",
          interval: interval.label,
        });
        totalSent++;
      }
    }
  }

  return { totalSent };
}

export async function processOverdueReminders() {
  const now = new Date();
  let totalSent = 0;

  // Overdue assignments
  const overdueAssignments = await prisma.assignment.findMany({
    where: {
      dueDate: { lt: now },
      course: { status: "PUBLISHED" },
    },
    include: {
      course: {
        include: {
          enrollments: { include: { student: true } },
        },
      },
    },
  });

  for (const assignment of overdueAssignments) {
    for (const enrollment of assignment.course.enrollments) {
      const submission = await prisma.submission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId: assignment.id,
            studentId: enrollment.studentId,
          },
        },
      });
      if (submission) continue;

      const prefs = await prisma.notificationPreference.findUnique({
        where: { userId: enrollment.studentId },
      });
      if (prefs && !prefs.overdueNotification) continue;

      const alreadySent = await hasReminderBeenSent({
        userId: enrollment.studentId,
        itemId: assignment.id,
        itemType: "ASSIGNMENT",
        reminderType: "OVERDUE",
        interval: "once",
      });
      if (alreadySent) continue;

      await createNotification({
        userId: enrollment.studentId,
        type: "OVERDUE_ASSIGNMENT",
        content: `Задание "${assignment.title}" по курсу "${assignment.course.title}" просрочено. Срок сдачи: ${assignment.dueDate!.toLocaleDateString("ru-RU")}`,
        assignmentId: assignment.id,
        courseId: assignment.courseId,
      });

      await markReminderSent({
        userId: enrollment.studentId,
        itemId: assignment.id,
        itemType: "ASSIGNMENT",
        reminderType: "OVERDUE",
        interval: "once",
      });
      totalSent++;
    }
  }

  // Overdue quizzes
  const overdueQuizzes = await prisma.quiz.findMany({
    where: {
      dueDate: { lt: now },
      course: { status: "PUBLISHED" },
    },
    include: {
      course: {
        include: {
          enrollments: { include: { student: true } },
        },
      },
    },
  });

  for (const quiz of overdueQuizzes) {
    for (const enrollment of quiz.course.enrollments) {
      const attempt = await prisma.quizAttempt.findFirst({
        where: {
          quizId: quiz.id,
          studentId: enrollment.studentId,
        },
      });
      if (attempt) continue;

      const prefs = await prisma.notificationPreference.findUnique({
        where: { userId: enrollment.studentId },
      });
      if (prefs && !prefs.overdueNotification) continue;

      const alreadySent = await hasReminderBeenSent({
        userId: enrollment.studentId,
        itemId: quiz.id,
        itemType: "QUIZ",
        reminderType: "OVERDUE",
        interval: "once",
      });
      if (alreadySent) continue;

      await createNotification({
        userId: enrollment.studentId,
        type: "OVERDUE_QUIZ",
        content: `Тест "${quiz.title}" по курсу "${quiz.course.title}" просрочен. Срок сдачи: ${quiz.dueDate!.toLocaleDateString("ru-RU")}`,
        quizId: quiz.id,
        courseId: quiz.courseId,
      });

      await markReminderSent({
        userId: enrollment.studentId,
        itemId: quiz.id,
        itemType: "QUIZ",
        reminderType: "OVERDUE",
        interval: "once",
      });
      totalSent++;
    }
  }

  return { totalSent };
}
