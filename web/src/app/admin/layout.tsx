import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Users, Video, Database, BarChart3, Key, ClipboardList, TrendingUp, BookOpen, GraduationCap, Target, BarChart2, Clock } from "lucide-react";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const t = await getTranslations("admin");

  const navItems = [
    { href: "/admin", label: t("navAnalytics"), icon: BarChart3 },
    { href: "/admin/users", label: t("navUsers"), icon: Users },
    { href: "/admin/videos", label: t("navVideos"), icon: Video },
    { href: "/admin/analytics", label: t("navAnalytics"), icon: TrendingUp },
    { href: "/admin/analytics/students", label: t("navStudentReports"), icon: BookOpen },
    { href: "/admin/analytics/videos", label: t("navVideoReports"), icon: Video },
    { href: "/admin/analytics/courses", label: t("navCourseAnalytics"), icon: GraduationCap },
    { href: "/admin/courses", label: t("courses"), icon: BookOpen },
    { href: "/admin/grades", label: t("navGrades"), icon: GraduationCap },
    { href: "/admin/analytics/performance", label: t("navPerformance"), icon: Target },
    { href: "/admin/analytics/comparative", label: t("navComparative"), icon: BarChart2 },
    { href: "/admin/analytics/trends", label: t("navTrends"), icon: Clock },
    { href: "/admin/database", label: t("navDatabase"), icon: Database },
    { href: "/admin/invitation-codes", label: t("navInviteCodes"), icon: Key },
    { href: "/admin/audit", label: t("navAuditLog"), icon: ClipboardList },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 p-4">
        <div className="mb-6">
          <h1 className="text-lg font-bold">{t("dashboard")}</h1>
          <p className="text-sm text-muted-foreground">{t("systemOverview")}</p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 pt-4 border-t">
          <LocaleSwitcher />
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
