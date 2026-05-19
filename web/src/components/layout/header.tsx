"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { SearchBar } from "@/components/search/search-bar";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import { Menu, Upload, User, LogOut, Settings, Shield } from "lucide-react";

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const t = useTranslations("layout");

  return (
    <header className="fixed top-0 z-40 w-full border-b bg-background">
      <div className="flex h-16 items-center gap-4 px-4">
        {/* Mobile menu button */}
        <button
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? t("closeMenu") : t("openMenu")}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary-foreground" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="hidden sm:inline-block">{t("logo")}</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-auto hidden md:block">
          <SearchBar />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {status === "loading" ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
          ) : session ? (
            <>
              <NotificationBadge />

              {session.user?.role !== "STUDENT" && (
              <Link href="/studio/upload">
                <Button variant="ghost" size="icon">
                  <Upload className="h-5 w-5" />
                </Button>
              </Link>
              )}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label={t("userMenu")}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  <Avatar
                    src={session.user?.image || undefined}
                    fallback={session.user?.name?.[0] || "U"}
                    size="sm"
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover p-2 shadow-lg" role="menu">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium">{session.user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                    </div>
                    <Link href="/settings/profile" onClick={() => setUserMenuOpen(false)}>
                      <button className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent" role="menuitem">
                        <User className="h-4 w-4" />
                        {t("profile")}
                      </button>
                    </Link>
                    {session.user?.role !== "STUDENT" && (
                    <Link href="/studio" onClick={() => setUserMenuOpen(false)}>
                      <button className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent" role="menuitem">
                        <Settings className="h-4 w-4" />
                        {t("studio")}
                      </button>
                    </Link>
                    )}
                    {session.user?.role === "ADMIN" && (
                    <Link href="/admin" onClick={() => setUserMenuOpen(false)}>
                      <button className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10" role="menuitem">
                        <Shield className="h-4 w-4" />
                        {t("adminPanel")}
                      </button>
                    </Link>
                    )}
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("signOut")}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/login">
              <Button variant="default">{t("signIn")}</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile search */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="border-t p-4 md:hidden">
          <SearchBar />
        </div>
      )}
    </header>
  );
}
