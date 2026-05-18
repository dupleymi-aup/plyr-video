"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Trash2,
  GripVertical,
  Video,
  FileText,
  HelpCircle,
  Edit,
  Save,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const LESSON_TYPE_ICONS: Record<string, React.ReactNode> = {
  VIDEO: <Video className="h-4 w-4" />,
  TEXT: <FileText className="h-4 w-4" />,
  QUIZ: <HelpCircle className="h-4 w-4" />,
  ASSIGNMENT: <FileText className="h-4 w-4" />,
};

const LESSON_TYPE_LABELS: Record<string, string> = {
  VIDEO: "Видео",
  TEXT: "Текст",
  QUIZ: "Тест",
  ASSIGNMENT: "Задание",
};

export default function CourseEditor() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;

  const { data: course, isLoading } = useSWR(
    courseId ? `/api/courses/${courseId}` : null,
    fetcher
  );

  const [activeTab, setActiveTab] = useState<"lessons" | "assignments" | "quizzes" | "enrollments">("lessons");

  // Lesson creation
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonType, setNewLessonType] = useState("VIDEO");
  const [newLessonVideoId, setNewLessonVideoId] = useState("");

  // Assignment creation
  const [newAssignmentTitle, setNewAssignmentTitle] = useState("");
  const [newAssignmentMaxScore, setNewAssignmentMaxScore] = useState(100);
  const [newAssignmentDueDate, setNewAssignmentDueDate] = useState("");

  // Enrollment
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Quiz creation
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [newQuizMaxScore, setNewQuizMaxScore] = useState(100);
  const [newQuizTimeLimit, setNewQuizTimeLimit] = useState("");

  const searchStudents = async () => {
    if (!newStudentEmail.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/admin/users/search?email=${encodeURIComponent(newStudentEmail)}`);
    if (res.ok) {
      const users = await res.json();
      setSearchResults(users);
    }
    setSearching(false);
  };

  const enrollStudent = async (studentId: string) => {
    const res = await fetch(`/api/courses/${courseId}/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    if (res.ok) {
      setSearchResults([]);
      setNewStudentEmail("");
      mutate(`/api/courses/${courseId}`);
    } else {
      const err = await res.json();
      alert(err.error || "Ошибка при записи");
    }
  };

  const handleAddLesson = async () => {
    if (!newLessonTitle.trim()) return;
    await fetch(`/api/courses/${courseId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newLessonTitle,
        lessonType: newLessonType,
        videoId: newLessonVideoId || null,
      }),
    });
    setNewLessonTitle("");
    setNewLessonVideoId("");
    mutate(`/api/courses/${courseId}`);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Удалить урок?")) return;
    await fetch(`/api/lessons/${lessonId}`, { method: "DELETE" });
    mutate(`/api/courses/${courseId}`);
  };

  const handleAddAssignment = async () => {
    if (!newAssignmentTitle.trim()) return;
    await fetch(`/api/courses/${courseId}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newAssignmentTitle,
        maxScore: newAssignmentMaxScore,
        dueDate: newAssignmentDueDate || null,
      }),
    });
    setNewAssignmentTitle("");
    setNewAssignmentMaxScore(100);
    setNewAssignmentDueDate("");
    mutate(`/api/courses/${courseId}`);
  };

  const handleAddQuiz = async () => {
    if (!newQuizTitle.trim()) return;
    await fetch(`/api/courses/${courseId}/quizzes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newQuizTitle,
        maxScore: newQuizMaxScore,
        timeLimit: newQuizTimeLimit ? Number(newQuizTimeLimit) : null,
      }),
    });
    setNewQuizTitle("");
    setNewQuizMaxScore(100);
    setNewQuizTimeLimit("");
    mutate(`/api/courses/${courseId}`);
  };

  const handleEnrollStudent = async () => {
    if (!newStudentEmail.trim()) return;
    await searchStudents();
  };

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Загрузка...</div>;
  }

  if (!course) {
    return <div className="p-6 text-muted-foreground">Курс не найден</div>;
  }

  const lessons = course.lessons || [];
  const assignments = course._count?.assignments || 0;
  const quizzes = course._count?.quizzes || 0;
  const enrollments = course._count?.enrollments || 0;

  const tabs = [
    { key: "lessons" as const, label: "Уроки", count: lessons.length },
    { key: "assignments" as const, label: "Задания", count: assignments },
    { key: "quizzes" as const, label: "Тесты", count: quizzes },
    { key: "enrollments" as const, label: "Студенты", count: enrollments },
  ];

  return (
    <div className="p-6">
      <Link
        href="/studio/courses"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к курсам
      </Link>

      {/* Course Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              course.status === "PUBLISHED"
                ? "bg-green-100 text-green-700"
                : course.status === "ARCHIVED"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {course.status === "PUBLISHED" ? "Опубликован" : course.status === "ARCHIVED" ? "В архиве" : "Черновик"}
          </span>
        </div>
        {course.description && (
          <p className="text-muted-foreground">{course.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Lessons Tab */}
      {activeTab === "lessons" && (
        <div>
          {/* Add Lesson */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Добавить урок</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Название урока..."
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={newLessonType}
                  onChange={(e) => setNewLessonType(e.target.value)}
                  className="px-3 py-2 rounded-md border bg-background text-sm"
                >
                  <option value="VIDEO">Видео</option>
                  <option value="TEXT">Текст</option>
                  <option value="QUIZ">Тест</option>
                  <option value="ASSIGNMENT">Задание</option>
                </select>
                <button
                  onClick={handleAddLesson}
                  disabled={!newLessonTitle.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Добавить
                </button>
              </div>
              {newLessonType === "VIDEO" && (
                <input
                  type="text"
                  placeholder="ID видео (необязательно)..."
                  value={newLessonVideoId}
                  onChange={(e) => setNewLessonVideoId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
            </CardContent>
          </Card>

          {/* Lesson List */}
          <div className="space-y-2">
            {lessons.map((lesson: any) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground w-6">{lesson.position + 1}</span>
                  <div className="flex items-center gap-2">
                    {LESSON_TYPE_ICONS[lesson.lessonType]}
                    <span className="font-medium">{lesson.title}</span>
                  </div>
                  {lesson.video && (
                    <span className="text-xs text-muted-foreground">
                      {lesson.video.title}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteLesson(lesson.id)}
                  className="text-muted-foreground hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {lessons.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Нет уроков. Добавьте первый урок выше.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === "assignments" && (
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Добавить задание</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-4">
                <input
                  type="text"
                  placeholder="Название..."
                  value={newAssignmentTitle}
                  onChange={(e) => setNewAssignmentTitle(e.target.value)}
                  className="md:col-span-2 px-3 py-2 rounded-md border bg-background text-sm"
                />
                <input
                  type="number"
                  placeholder="Макс. балл"
                  value={newAssignmentMaxScore}
                  onChange={(e) => setNewAssignmentMaxScore(Number(e.target.value))}
                  className="px-3 py-2 rounded-md border bg-background text-sm"
                />
                <input
                  type="date"
                  value={newAssignmentDueDate}
                  onChange={(e) => setNewAssignmentDueDate(e.target.value)}
                  className="px-3 py-2 rounded-md border bg-background text-sm"
                />
              </div>
              <button
                onClick={handleAddAssignment}
                disabled={!newAssignmentTitle.trim()}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Добавить задание
              </button>
            </CardContent>
          </Card>
          <div className="text-center py-8 text-muted-foreground">
            Задания будут отображаться здесь после создания
          </div>
        </div>
      )}

      {/* Quizzes Tab */}
      {activeTab === "quizzes" && (
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Добавить тест</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-3">
                <input
                  type="text"
                  placeholder="Название теста..."
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                  className="md:col-span-2 px-3 py-2 rounded-md border bg-background text-sm"
                />
                <input
                  type="number"
                  placeholder="Макс. балл"
                  value={newQuizMaxScore}
                  onChange={(e) => setNewQuizMaxScore(Number(e.target.value))}
                  className="px-3 py-2 rounded-md border bg-background text-sm"
                />
                <input
                  type="number"
                  placeholder="Лимит (минуты, необязательно)"
                  value={newQuizTimeLimit}
                  onChange={(e) => setNewQuizTimeLimit(e.target.value)}
                  className="px-3 py-2 rounded-md border bg-background text-sm"
                />
              </div>
              <button
                onClick={handleAddQuiz}
                disabled={!newQuizTitle.trim()}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Добавить тест
              </button>
              <p className="text-xs text-muted-foreground mt-2">
                Вопросы можно добавить через API. Тесты с типом MULTIPLE_CHOICE и TRUE_FALSE оцениваются автоматически.
              </p>
            </CardContent>
          </Card>
          <div className="text-center py-8 text-muted-foreground">
            Список тестов будет отображаться здесь после создания
          </div>
        </div>
      )}

      {/* Enrollments Tab */}
      {activeTab === "enrollments" && (
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Записать студента</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Email студента..."
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEnrollStudent()}
                  className="flex-1 px-3 py-2 rounded-md border bg-background text-sm"
                />
                <button
                  onClick={handleEnrollStudent}
                  disabled={searching || !newStudentEmail.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  <Users className="h-4 w-4" />
                  {searching ? "Поиск..." : "Найти"}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm text-muted-foreground mb-2">Найдено:</p>
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between py-2 px-3 rounded-md border"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {user.name || "Без имени"}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <button
                        onClick={() => enrollStudent(user.id)}
                        className="px-3 py-1 text-xs rounded-md bg-green-600 text-white hover:bg-green-700"
                      >
                        Записать
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <div className="text-center py-8 text-muted-foreground">
            Список записанных студентов будет отображаться здесь
          </div>
        </div>
      )}
    </div>
  );
}
