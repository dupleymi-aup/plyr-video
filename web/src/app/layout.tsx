import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { NextIntlClientProvider } from "next-intl";
import "plyr/dist/plyr.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Plyr Platform - Video Platform",
  description: "A modern video platform powered by Plyr player",
};

async function getLocale() {
  // Try to get locale from cookie (set by locale switcher)
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value;
  if (locale === "ru" || locale === "en") return locale;
  return "ru"; // default
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  let messages = {};
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch {
    messages = (await import("../../../messages/ru.json")).default;
  }

  return (
    <html lang={locale} className={`${inter.variable} font-sans`}>
      <body className="min-h-full bg-background antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
