import { NextResponse } from "next/server";

export type Role = "STUDENT" | "TEACHER" | "ADMIN";

export const ROLE_LEVELS: Record<Role, number> = {
  STUDENT: 1,
  TEACHER: 2,
  ADMIN: 3,
};

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
}

export const ROUTE_ROLE_REQUIREMENTS: Record<string, Role> = {
  "/studio": "TEACHER",
  "/admin": "ADMIN",
};

export function getRequiredRoleForPath(pathname: string): Role | null {
  for (const [prefix, role] of Object.entries(ROUTE_ROLE_REQUIREMENTS)) {
    if (pathname.startsWith(prefix)) {
      return role as Role;
    }
  }
  return null;
}

export function checkRoleAccess(
  userRole: Role | undefined,
  requiredRole: Role
): NextResponse | null {
  if (!userRole || !hasRole(userRole, requiredRole)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }
  return null;
}
