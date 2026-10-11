"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { createBrowserClient } from "@insforge/sdk/ssr";
import { usePathname } from "next/navigation";
import { logout } from "@/features/auth/user-actions";
import { Button } from "@gleans/ui/button";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@gleans/ui/dropdown-menu";

type NavigationAccount = { name: string; email: string };

export function AuthNav({ onNavigate }: { onNavigate?: () => void }) {
  const [account, setAccount] = useState<NavigationAccount | null | undefined>(undefined);
  const pathname = usePathname();
  useEffect(() => {
    let active = true;
    async function load() {
      if (!process.env.NEXT_PUBLIC_INSFORGE_URL || !process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY) { if (active) setAccount(null); return; }
      try {
        const { data, error } = await createBrowserClient().auth.getCurrentUser();
        const user = !error ? data?.user : null;
        const name = typeof user?.profile?.name === "string" ? user.profile.name.trim() : "";
        if (active) setAccount(user ? { name: name || user.email.split("@")[0], email: user.email } : null);
      } catch { if (active) setAccount(null); }
    }
    void load();
    const refresh = () => { void load(); };
    window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("focus", refresh); };
  }, [pathname]);
  if (account === undefined) return <span role="status" aria-label="Memuat akun" className="h-10 w-24 animate-pulse rounded-full bg-muted" />;
  if (!account) return <div className="flex items-center gap-6"><Button asChild size="pill-sm" variant="outline"><Link href="/masuk" onClick={onNavigate}>Masuk</Link></Button><Button asChild size="pill-sm"><Link href="/daftar" onClick={onNavigate}>Daftar</Link></Button></div>;
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" aria-label={`Menu akun ${account.name}`} className="h-11 min-w-0 gap-2 rounded-full border border-border bg-white px-3">
        <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent font-medium text-primary">{account.name[0]?.toUpperCase()}</span>
        <span title={account.name} className="max-w-40 truncate sm:max-w-48">{account.name}</span>
        <ChevronDown className="size-4 shrink-0" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-2xl p-2">
      <DropdownMenuLabel className="px-3 py-2"><p className="break-words text-sm font-medium">{account.name}</p><p className="mt-1 break-words text-xs font-normal text-muted-foreground">{account.email}</p></DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5"><Link href="/akun" onClick={onNavigate}><LayoutDashboard />Dashboard</Link></DropdownMenuItem>
      <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5"><Link href="/dashboard/pengaturan" onClick={onNavigate}><Settings />Pengaturan akun</Link></DropdownMenuItem>
      <DropdownMenuSeparator />
      <form action={logout}><DropdownMenuItem asChild onSelect={event => event.preventDefault()} className="rounded-xl px-3 py-2.5"><button type="submit" className="w-full"><LogOut />Keluar</button></DropdownMenuItem></form>
    </DropdownMenuContent>
  </DropdownMenu>;
}
