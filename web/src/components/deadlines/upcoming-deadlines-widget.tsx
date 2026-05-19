"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Calendar, AlertTriangle, BookOpen, FileText } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
});

export function UpcomingDeadlinesWidget() {
  const { data: session } = useSession();
  const { data, isLoading } = useSWR(
    session ? "/api/deadlines/upcoming" : null,
    fetcher,
    { refreshInterval: 300000 }
  );

  if (!session || isLoading) return null;

  const deadlines = data?.deadlines || [];
  if (deadlines.length === 0) return null;

  const upcoming = deadlines.filter((d: { status: string }) => d.status === "upcoming");
  const overdue = deadlines.filter((d: { status: string }) => d.status === "overdue");

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Предстоящие сроки
      </h3>
      <div className="space-y-2">
        {overdue.map((d: { id: string; type: string; title: string; dueDate: string; courseId: string; courseTitle: string; status: string }) => (
          <DeadlineItem key={d.id} deadline={d} isOverdue />
        ))}
        {upcoming.slice(0, 5).map((d: { id: string; type: string; title: string; dueDate: string; courseId: string; courseTitle: string; status: string }) => (
          <DeadlineItem key={d.id} deadline={d} />
        ))}
        {deadlines.length > 5 && (
          <Link
            href="/dashboard"
            className="text-sm text-primary hover:underline block text-center pt-2"
          >
            Все сроки ({deadlines.length})
          </Link>
        )}
      </div>
    </div>
  );
}

function DeadlineItem({ deadline, isOverdue }: { deadline: { id: string; type: string; title: string; dueDate: string; courseId: string; courseTitle: string; status: string }; isOverdue?: boolean }) {
  const dueDate = new Date(deadline.dueDate);
  const isAssignment = deadline.type === "assignment";

  return (
    <Link
      href={`/courses/${deadline.courseId}/learn`}
      className="flex items-start gap-3 p-2 rounded-md hover:bg-accent transition-colors"
    >
      {isOverdue ? (
        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
      ) : isAssignment ? (
        <FileText className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
      ) : (
        <BookOpen className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium truncate ${isOverdue ? "text-red-500" : ""}`}>
          {deadline.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {deadline.courseTitle} &middot;{" "}
          {isOverdue
            ? `Просрочено с ${dueDate.toLocaleDateString("ru-RU")}`
            : `Срок: ${dueDate.toLocaleDateString("ru-RU")}`}
        </p>
      </div>
    </Link>
  );
}
