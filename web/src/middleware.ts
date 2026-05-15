import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getRequiredRoleForPath, ROLE_LEVELS, type Role } from "@/lib/permissions";

const protectedRoutes = ["/studio", "/settings", "/subscriptions", "/admin"];

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  const isAuthenticated = !!req.auth;
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && req.auth?.user) {
    const userRole = req.auth.user.role as Role | undefined;
    const banned = req.auth.user.banned as boolean;

    if (banned) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("banned", "1");
      return NextResponse.redirect(loginUrl);
    }

    const requiredRole = getRequiredRoleForPath(pathname);
    if (requiredRole && userRole && ROLE_LEVELS[userRole] < ROLE_LEVELS[requiredRole]) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
