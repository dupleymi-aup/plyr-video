import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role, ROLE_LEVELS } from "@/lib/permissions";

export async function requireRole(requiredRole: Role) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  if (!userRole || !(userRole in ROLE_LEVELS) || ROLE_LEVELS[userRole] < ROLE_LEVELS[requiredRole]) {
    redirect("/");
  }
}
