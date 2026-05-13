"use client";

import { useState, type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60}>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16">
          <Sidebar />
          <main className="lg:ml-60">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
