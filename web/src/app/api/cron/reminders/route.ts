import { NextRequest, NextResponse } from "next/server";
import { processDeadlineReminders, processOverdueReminders } from "@/lib/reminders";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [deadlines, overdue] = await Promise.all([
      processDeadlineReminders(),
      processOverdueReminders(),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      deadlineRemindersSent: deadlines.totalSent,
      overdueRemindersSent: overdue.totalSent,
    });
  } catch (error) {
    console.error("[cron/reminders] Error:", error);
    return NextResponse.json(
      { error: "Failed to process reminders", details: String(error) },
      { status: 500 }
    );
  }
}
