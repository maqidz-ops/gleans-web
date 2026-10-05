import { redirect } from "next/navigation";
import { currentUser } from "@/lib/insforge/server";
import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
export const metadata = { title: "Akun", robots: { index: false, follow: false } };
export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/masuk");
  return <section className="mx-auto w-full max-w-xl px-5 py-16"><div className="flex flex-col gap-6 rounded-[24px] border bg-white p-6"><h1 className="text-2xl font-semibold">Akun Saya</h1><div><p className="text-sm text-muted-foreground">Email</p><p className="break-all font-medium">{user.email}</p></div><form action={logout}><Button type="submit" size="pill">Keluar</Button></form></div></section>;
}
