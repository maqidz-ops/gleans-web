"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard, ReceiptText, Wallet, Settings, ArrowUpRight, Menu, RotateCcw } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetHeader, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { AccountMenu } from "./account-menu";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { useDashboard } from "./provider";
import { cn } from "@/lib/utils";
const links = [ { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard }, { href: "/dashboard/pesanan", label: "Pesanan", icon: ReceiptText }, { href: "/dashboard/paket-saldo", label: "Paket & Saldo", icon: Wallet }, { href: "/dashboard/pengaturan", label: "Pengaturan", icon: Settings } ];
function Navigation({ close }: { close?: () => void }) {
  const path = usePathname();
  return <nav aria-label="Menu dashboard" className="flex flex-col gap-2">{links.map(x => <Link onClick={close} key={x.href} href={x.href} aria-current={path === x.href ? "page" : undefined} className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors hover:bg-accent", path === x.href ? "bg-accent font-medium text-primary" : "text-muted-foreground")}><x.icon className="size-5" />{x.label}</Link>)}</nav>;
}
function Shell({ children }: { children: ReactNode }) {
  const { ready, dispatch, storageError, enterDemo } = useDashboard(); const [menu, setMenu] = useState(false); const [reset, setReset] = useState(false);
  useEffect(() => { if (ready) enterDemo(); }, [ready, enterDemo]);
  return <div className="min-h-dvh bg-white lg:pl-[320px]">
    <aside className="fixed inset-y-0 left-0 hidden w-[320px] flex-col border-r bg-white p-5 lg:flex"><Link href="/" aria-label="Gleans - Beranda" className="mb-12 mt-3 px-3"><Logo className="h-8" /></Link><p className="mb-4 px-4 text-xs font-medium tracking-wider text-muted-foreground">MENU UTAMA</p><Navigation /><div className="mt-auto rounded-2xl bg-surface p-4"><p className="text-sm font-medium">Satu langkah lebih dekat.</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Kelola kebutuhan tulisan akademikmu bersama Gleans.</p><Link href="/" className="mt-4 flex items-center gap-1 text-xs text-primary">Ke website<ArrowUpRight className="size-3.5" /></Link></div></aside>
    <header className="flex h-20 items-center justify-between gap-3 border-b px-4 sm:px-8"><div className="flex items-center gap-3"><Sheet open={menu} onOpenChange={setMenu}><SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Buka menu dashboard" className="lg:hidden"><Menu /></Button></SheetTrigger><SheetContent side="left" className="w-72 p-5"><SheetHeader className="mb-6 px-0"><SheetTitle>Dashboard Gleans</SheetTitle><SheetDescription className="sr-only">Navigasi ruang kerja akun demo Gleans.</SheetDescription></SheetHeader><Navigation close={() => setMenu(false)} /><Link href="/" className="mt-6 block text-sm text-primary">Ke website Gleans</Link></SheetContent></Sheet></div><AccountMenu /></header>
    <main className="mx-auto max-w-[1280px] p-4 sm:p-8"><div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-accent/60 px-4 py-3"><div className="flex items-center gap-3"><span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-medium whitespace-nowrap text-primary">Mode demo</span><p className="text-xs text-muted-foreground">Data contoh. Tidak ada pembayaran atau pemeriksaan nyata.</p></div><Button variant="ghost" onClick={() => setReset(true)} disabled={!ready} className="text-xs text-primary"><RotateCcw className="size-3.5" />Reset demo</Button></div>{storageError && <p role="alert" className="mb-4 text-sm text-destructive">{storageError}</p>}{ready ? children : <p role="status" className="py-20 text-center text-muted-foreground">Menyiapkan ruang kerjamu…</p>}</main>
    <Dialog open={reset} onOpenChange={setReset}><DialogContent className="rounded-[24px]"><DialogHeader><DialogTitle>Mulai ulang demo?</DialogTitle><DialogDescription>Hanya data dashboard demo yang direset. Pilih data contoh atau mulai dari akun kosong.</DialogDescription></DialogHeader><div className="flex flex-wrap justify-end gap-3"><Button variant="outline" size="pill-sm" onClick={() => { dispatch({ type: "reset", empty: true }); setReset(false); }}>Akun kosong</Button><Button size="pill-sm" onClick={() => { dispatch({ type: "reset" }); setReset(false); }}>Pulihkan data contoh</Button></div></DialogContent></Dialog>
  </div>;
}
export function DashboardShell({ children }: { children: ReactNode }) { return <Shell>{children}</Shell>; }
