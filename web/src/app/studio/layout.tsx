import { requireRole } from "@/lib/server-auth";

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("TEACHER");
  return <>{children}</>;
}
