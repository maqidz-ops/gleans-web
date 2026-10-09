"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { shieldAccess } from "@/lib/shield-retention";
import { useAdmin } from "./provider";

const storageKey = "gleans:admin-notifications:read:v1";
export function AdminNotifications() {
  const { state, ready } = useAdmin();
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<string[]>([]);
  const [now, setNow] = useState(0);
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(storageKey) || "[]"); if (Array.isArray(saved)) setRead(saved.filter(x => typeof x === "string")); } catch {}
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const items = ready && now ? state.orders.flatMap(order => {
    const access = shieldAccess(order.completedAt, now);
    const title = order.processing === "Gagal" ? "Pemeriksaan gagal" : order.failureReason === "rate_limit" ? "Pemeriksaan menunggu layanan" : order.payment === "Menunggu" ? "Pembayaran menunggu" : order.processing === "Selesai" && access.status === "expired" ? "Masa unduh berakhir" : order.processing === "Selesai" && access.status === "available" ? "Hasil Shield tersedia" : "";
    if (!title) return [];
    const message = order.processing === "Gagal" ? "Kuota layanan perlu diperiksa sebelum mencoba ulang." : order.failureReason === "rate_limit" ? "Batas request sementara tercapai. Pesanan tetap di antrean." : order.payment === "Menunggu" ? "Pesanan belum dapat diproses sebelum pembayaran berhasil." : access.status === "expired" ? "Akses dokumen dan laporan telah melewati batas 24 jam." : `Pelanggan memiliki sisa ${Math.ceil(access.remainingMs / 3600000)} jam untuk mengunduh.`;
    return [{ id: `${order.id}:${title}:${order.completedAt || order.date}`, orderId: order.id, title, message, document: order.document }];
  }) : [];
  const unread = items.filter(x => !read.includes(x.id)).length;
  function mark(ids: string[]) {
    const next = [...new Set([...read, ...ids])]; setRead(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  }
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="ghost" size="icon" className="relative rounded-full lg:fixed lg:left-[260px] lg:top-7 lg:z-20" aria-label={`Notifikasi admin${unread ? `, ${unread} belum dibaca` : ""}`}><Bell className="size-5"/>{unread > 0 && <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">{unread > 9 ? "9+" : unread}</span>}</Button></DialogTrigger>
    <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-[24px] sm:max-w-lg">
      <DialogHeader><DialogTitle>Notifikasi</DialogTitle><DialogDescription>{unread ? `${unread} pemberitahuan belum dibaca` : "Semua pemberitahuan sudah dibaca"}</DialogDescription></DialogHeader>
      <div className="flex justify-end"><Button variant="ghost" size="pill-sm" disabled={!unread} onClick={() => mark(items.map(x => x.id))}>Tandai semua dibaca</Button></div>
      <div className="space-y-2">{items.map(item => <Link key={item.id} href={`/admin/pesanan?detail=${item.orderId}`} onClick={() => { mark([item.id]); setOpen(false); }} className={`flex items-start gap-3 rounded-xl p-4 hover:bg-accent ${read.includes(item.id) ? "bg-surface" : "bg-accent/60"}`}>
        <span className={`mt-1.5 size-2 shrink-0 rounded-full ${read.includes(item.id) ? "bg-transparent" : "bg-primary"}`}/><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 break-words text-xs">{item.orderId} · {item.document}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.message}</p></div><ArrowUpRight className="size-4 shrink-0 text-primary"/>
      </Link>)}{!items.length && <p className="py-8 text-center text-sm text-muted-foreground">Belum ada notifikasi.</p>}</div>
    </DialogContent>
  </Dialog>;
}
