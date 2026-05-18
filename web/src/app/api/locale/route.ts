import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { locale } = body;

  if (!["ru", "en"].includes(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("NEXT_LOCALE", locale, {
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}
