"use client";

import { useState } from "react";
import { Languages } from "lucide-react";

export function LocaleSwitcher() {
  const [locale, setLocale] = useState<"ru" | "en">(
    typeof document !== "undefined"
      ? (document.cookie
          .split("; ")
          .find((c) => c.startsWith("NEXT_LOCALE="))
          ?.split("=")[1] as "ru" | "en") || "ru"
      : "ru"
  );

  const switchLocale = async (newLocale: "ru" | "en") => {
    try {
      const res = await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: newLocale }),
      });
      if (!res.ok) return;
    } catch {
      return;
    }
    setLocale(newLocale);
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-1">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <button
        onClick={() => switchLocale("ru")}
        className={`px-2 py-1 text-xs rounded ${
          locale === "ru"
            ? "bg-primary text-primary-foreground"
            : "hover:bg-accent"
        }`}
      >
        RU
      </button>
      <button
        onClick={() => switchLocale("en")}
        className={`px-2 py-1 text-xs rounded ${
          locale === "en"
            ? "bg-primary text-primary-foreground"
            : "hover:bg-accent"
        }`}
      >
        EN
      </button>
    </div>
  );
}
