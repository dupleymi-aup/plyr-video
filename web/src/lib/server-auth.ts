import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role, ROLE_LEVELS } from "@/lib/permissions";

export async function requireRole(requiredRole: Role) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (ROLE_LEVELS[session.user.role as Role] < ROLE_LEVELS[requiredRole]) {
    redirect("/");
  }
}
