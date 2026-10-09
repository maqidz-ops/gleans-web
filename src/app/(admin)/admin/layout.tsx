import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/shell";
export const metadata: Metadata = { title: "Admin Demo", robots: { index: false, follow: false } };
export default function Layout({children}:{children:React.ReactNode}){return <AdminShell>{children}</AdminShell>;}
