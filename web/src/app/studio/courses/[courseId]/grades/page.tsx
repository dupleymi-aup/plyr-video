"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CourseGrades() {
  const params = useParams();
  const courseId = params?.courseId as string;

  const { data: course, isLoading: courseLoading } = useSWR(
    courseId ? `/api/courses/${courseId}` : null,
    fetcher
  );

  const { data: grades, isLoading: gradesLoading } = useSWR(
    courseId ? `/api/courses/${courseId}/grades` : null,
    fetcher
  );

  const { data: enrollments, isLoading: enrollmentsLoading } = useSWR(
    courseId ? `/api/courses/${courseId}/enrollments` : null,
    fetcher
  );

  const [gradingStudentId, setGradingStudentId] = useState("");
  const [gradingValue, setGradingValue] = useState("");
  const [gradingNote, setGradingNote] = useState("");

  const handleGrade = async () => {
    if (!gradingStudentId || gradingValue === "") return;
    await fetch(`/api/courses/${courseId}/grades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: gradingStudentId,
        value: Number(gradingValue),
        note: gradingNote || null,
      }),
    });
    setGradingStudentId("");
    setGradingValue("");
    setGradingNote("");
    mutate(`/api/courses/${courseId}/grades`);
  };

  if (courseLoading || gradesLoading) {
    return <div className="p-6 text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="p-6">
      <Link
        href="/studio/courses"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к курсам
      </Link>

      <h1 className="text-2xl font-bold mb-2">
        {course?.title} — Оценки
      </h1>
      <p className="text-muted-foreground mb-6">
        Журнал оценок студентов
      </p>

      {/* Grade Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Выставить оценку</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4">
            <select
              value={gradingStudentId}
              onChange={(e) => setGradingStudentId(e.target.value)}
              className="px-3 py-2 rounded-md border bg-background text-sm"
            >
              <option value="">Выберите студента</option>
              {(enrollments || []).map((e: any) => (
                <option key={e.studentId} value={e.studentId}>
                  {e.student.name || e.student.email}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Оценка (0-100)"
              value={gradingValue}
              onChange={(e) => setGradingValue(e.target.value)}
              className="px-3 py-2 rounded-md border bg-background text-sm"
              min="0"
              max="100"
            />
            <input
              type="text"
              placeholder="Заметка (необязательно)"
              value={gradingNote}
              onChange={(e) => setGradingNote(e.target.value)}
              className="px-3 py-2 rounded-md border bg-background text-sm"
            />
            <button
              onClick={handleGrade}
              disabled={!gradingStudentId || gradingValue === ""}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Сохранить
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Журнал оценок</CardTitle>
        </CardHeader>
        <CardContent>
          {!grades || grades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Оценок пока нет
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Студент</th>
                  <th className="text-right px-4 py-3 font-medium">Оценка</th>
                  <th className="text-left px-4 py-3 font-medium">Заметка</th>
                  <th className="text-left px-4 py-3 font-medium">Дата</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g: any) => (
                  <tr key={g.id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      {g.enrollment.student.name || g.enrollment.student.email}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-medium ${
                          g.value >= 80
                            ? "text-green-600"
                            : g.value >= 60
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {g.value}
                        {g.scale === "PERCENT" ? "%" : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {g.note || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(g.createdAt).toLocaleDateString("ru-RU")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
