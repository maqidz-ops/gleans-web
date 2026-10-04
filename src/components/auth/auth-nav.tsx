"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@insforge/sdk/ssr";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export function AuthNav({ onNavigate }: { onNavigate?: () => void }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    let active = true;
    async function load() {
      if (!process.env.NEXT_PUBLIC_INSFORGE_URL || !process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY) { if (active) setSignedIn(false); return; }
      try {
        const { data, error } = await createBrowserClient().auth.getCurrentUser();
        if (active) setSignedIn(!error && Boolean(data?.user));
      } catch { if (active) setSignedIn(false); }
    }
    void load();
    const refresh = () => { void load(); };
    window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("focus", refresh); };
  }, [pathname]);
  if (signedIn === null) return <span role="status" aria-label="Memuat akun" className="h-10 w-24 animate-pulse rounded-full bg-muted" />;
  return signedIn ? <><Button asChild size="pill-sm" variant="outline"><Link href="/akun" onClick={onNavigate}>Akun Saya</Link></Button><form action={logout}><Button type="submit" size="pill-sm" onClick={onNavigate}>Keluar</Button></form></> : <><Button asChild size="pill-sm" variant="outline"><Link href="/masuk" onClick={onNavigate}>Masuk</Link></Button><Button asChild size="pill-sm"><Link href="/daftar" onClick={onNavigate}>Daftar</Link></Button></>;
}
