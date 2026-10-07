"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { useDashboard } from "./provider";
import { Panel, Heading, fieldClass } from "./shared";
import { Button } from "@/components/ui/button";
import { z } from "zod";
const profileSchema = z.object({ name: z.string().trim().min(3,"Nama minimal 3 karakter.").max(100), email: z.string().trim().email("Email belum valid."), whatsapp: z.string().trim().regex(/^(\+?62|0)8\d{7,12}$/, "Masukkan nomor WhatsApp Indonesia yang valid.") });
export function DashboardSettings() {
  const { state, dispatch, leaveDemo } = useDashboard(); const [profile, setProfile] = useState(state.profile); const [error, setError] = useState("");
  useEffect(() => { setProfile(state.profile); setError(""); }, [state.profile]);
  return <><Heading title="Pengaturan akun" description="Kelola identitas yang tampil di ruang kerjamu." /><div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]"><Panel className="border border-border bg-white"><h2 className="mb-5 font-semibold">Profil demo</h2><form className="space-y-5" onSubmit={e => { e.preventDefault(); const result = profileSchema.safeParse(profile); if (!result.success) { setError(result.error.issues[0].message); return; } dispatch({ type: "profile", profile: result.data }); setError(""); toast.success("Profil demo diperbarui."); }}>{[{ key: "name", label: "Nama lengkap", type: "text" }, { key: "email", label: "Email", type: "email" }, { key: "whatsapp", label: "Nomor WhatsApp", type: "tel" }].map(f => <label key={f.key} className="block space-y-2"><span className="text-sm">{f.label}</span><input type={f.type} autoComplete="off" required value={profile[f.key as keyof typeof profile]} onChange={e => setProfile({ ...profile, [f.key]: e.target.value })} className={fieldClass} /></label>)}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<p className="text-xs text-muted-foreground">Gunakan identitas contoh. Perubahan hanya berlaku untuk demo di browser ini.</p><Button type="submit" size="pill-sm">Simpan perubahan</Button></form></Panel><Panel className="h-fit border border-border bg-white"><h2 className="font-semibold">Sesi demo</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Kembali ke halaman masuk kapan saja. Data demo tetap tersedia sampai kamu meresetnya.</p><Button asChild variant="outline" size="pill-sm" className="mt-6"><Link href="/masuk" onClick={leaveDemo}><LogOut />Keluar demo</Link></Button></Panel></div></>;
}
