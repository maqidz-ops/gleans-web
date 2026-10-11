import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/features/auth/server";
import { isAdmin } from "@/features/auth/session";
import { AdminShell } from "@/features/admin/components/shell";
export const metadata: Metadata = { title: "Admin Demo", robots: { index: false, follow: false } };
export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/masuk");
  if (!isAdmin(user)) redirect("/dashboard");
  const name = typeof user.profile?.name === "string" && user.profile.name.trim() ? user.profile.name : "Gleans";
  return <AdminShell name={name} email={user.email}>{children}</AdminShell>;
}
