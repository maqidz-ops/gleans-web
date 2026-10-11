"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { logout, updateUserProfile } from "@/features/auth/user-actions";
import { useDashboard } from "./provider";
import { Panel, Heading, fieldClass } from "./shared";
import { Button } from "@gleans/ui/button";
export function DashboardSettings() {
  const { state } = useDashboard();
  const router = useRouter();
  const [name, setName] = useState(state.profile.name);
  const [whatsapp, setWhatsapp] = useState(state.profile.whatsapp);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return <><Heading title="Pengaturan akun" description="Kelola profil akun Gleans kamu." />
    <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
      <Panel className="border border-border bg-white"><h2 className="mb-5 font-semibold">Profil akun</h2>
        <form className="space-y-5" onSubmit={async event => { event.preventDefault(); setPending(true); setError(""); try { const result = await updateUserProfile({ name, whatsapp }); if (result.error) setError(result.error); else { toast.success("Profil diperbarui."); router.refresh(); } } catch { setError("Profil belum dapat disimpan. Coba lagi nanti."); } finally { setPending(false); } }}>
          <label className="block space-y-2"><span className="text-sm">Nama lengkap</span><input value={name} onChange={event => setName(event.target.value)} minLength={3} maxLength={100} required autoComplete="name" className={fieldClass} /></label>
          <label className="block space-y-2"><span className="text-sm">Email</span><input value={state.profile.email} type="email" readOnly className={fieldClass} /></label>
          <label className="block space-y-2"><span className="text-sm">Nomor WhatsApp</span><input value={whatsapp} onChange={event => setWhatsapp(event.target.value)} type="tel" autoComplete="tel" maxLength={20} className={fieldClass} /></label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="pill-sm" disabled={pending}>{pending ? "Menyimpan…" : "Simpan perubahan"}</Button>
        </form>
      </Panel>
      <Panel className="h-fit border border-border bg-white"><h2 className="font-semibold">Sesi akun</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Keluar untuk mengakhiri sesi akun di perangkat ini.</p><form action={logout}><Button type="submit" variant="outline" size="pill-sm" className="mt-6"><LogOut />Keluar</Button></form></Panel>
    </div></>;
}
