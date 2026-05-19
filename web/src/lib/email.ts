import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@localhost";

const intervalLabels: Record<string, string> = {
  "7d": "7 дней",
  "3d": "3 дня",
  "1d": "24 часа",
  "1h": "1 час",
};

interface DeadlineEmailParams {
  to: string;
  name: string;
  title: string;
  type: "assignment" | "quiz";
  dueDate: Date;
  courseTitle: string;
  interval: string;
}

export async function sendDeadlineEmail(params: DeadlineEmailParams) {
  if (!resend) {
    console.warn("[email] Resend not configured, skipping email");
    return;
  }

  const itemType = params.type === "assignment" ? "Задание" : "Тест";
  const subject = `${itemType} "${params.title}" — срок через ${intervalLabels[params.interval] || params.interval}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Напоминание о сроке сдачи</h2>
          <p>Здравствуйте, ${params.name}!</p>
          <p>Ваш <strong>${itemType.toLowerCase()}</strong> «<strong>${params.title}</strong>»
             по курсу «<strong>${params.courseTitle}</strong>» необходимо сдать через
             <strong> ${intervalLabels[params.interval] || params.interval}</strong>.</p>
          <p>Срок сдачи: ${params.dueDate.toLocaleDateString("ru-RU")}</p>
          <p style="margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/courses"
               style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">
              Перейти к курсам
            </a>
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[email] Failed to send deadline email:", error);
  }
}

interface PasswordResetEmailParams {
  to: string;
  name: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail(params: PasswordResetEmailParams) {
  if (!resend) {
    console.warn("[email] Resend not configured, skipping email");
    return;
  }

  const subject = "Сброс пароля";

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Сброс пароля</h2>
          <p>Здравствуйте, ${params.name}!</p>
          <p>Вы запросили сброс пароля. Перейдите по ссылке ниже, чтобы установить новый пароль:</p>
          <p style="margin: 24px 0;">
            <a href="${params.resetUrl}"
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Сбросить пароль
            </a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            Если вы не запрашивали сброс пароля, проигнорируйте это письмо. Ссылка действительна в течение 1 часа.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[email] Failed to send password reset email:", error);
  }
}

interface GradeEmailParams {
  to: string;
  name: string;
  assignmentTitle: string;
  score: number;
  maxScore: number;
  courseTitle: string;
  feedback?: string | null;
}

export async function sendGradeEmail(params: GradeEmailParams) {
  if (!resend) {
    console.warn("[email] Resend not configured, skipping email");
    return;
  }

  const percentage = Math.round((params.score / params.maxScore) * 100);
  const subject = `Оценка за задание "${params.assignmentTitle}" — ${percentage}%`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Оценка выставлена</h2>
          <p>Здравствуйте, ${params.name}!</p>
          <p>Ваше задание «<strong>${params.assignmentTitle}</strong>»
             по курсу «<strong>${params.courseTitle}</strong>» оценено.</p>
          <p><strong>Балл: ${params.score}/${params.maxScore} (${percentage}%)</strong></p>
          ${params.feedback ? `<p>Комментарий: ${params.feedback}</p>` : ""}
          <p style="margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/courses"
               style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">
              Посмотреть оценки
            </a>
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[email] Failed to send grade email:", error);
  }
}
