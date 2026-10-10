import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/insforge/server";
import { AdminShell } from "@/components/admin/shell";
export const metadata: Metadata = { title: "Admin Demo", robots: { index: false, follow: false } };
export default async function Layout({children}:{children:React.ReactNode}){const admin=await currentAdmin();if(!admin)redirect("/masuk");return <AdminShell email={admin.email}>{children}</AdminShell>;}
