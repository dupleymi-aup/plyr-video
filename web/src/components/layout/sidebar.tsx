"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  TrendingUp,
  PlaySquare,
  Search,
  User,
  Settings,
  Upload,
  BarChart3,
  Video,
} from "lucide-react";

const mainNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/trending", label: "Trending", icon: TrendingUp },
  { href: "/subscriptions", label: "Subscriptions", icon: PlaySquare },
];

const studioNav = [
  { href: "/studio", label: "Dashboard", icon: BarChart3 },
  { href: "/studio/videos", label: "Videos", icon: Video },
  { href: "/studio/upload", label: "Upload", icon: Upload },
  { href: "/studio/settings", label: "Settings", icon: Settings },
];

const settingsNav = [
  { href: "/settings", label: "Account", icon: Settings },
  { href: "/settings/profile", label: "Profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  const isStudio = pathname.startsWith("/studio");
  const isSettings = pathname.startsWith("/settings");

  const navItems = isStudio ? studioNav : isSettings ? settingsNav : mainNav;

  return (
    <aside className="fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-60 flex-col overflow-y-auto border-r bg-background lg:flex">
      <div className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
