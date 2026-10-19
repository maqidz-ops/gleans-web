"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@gleans/ui/button";
import { formatRupiah } from "@/lib/format";
import type { PaymentOrder } from "../types";
const labels = { draft: "Belum memilih pembayaran", creating: "Menyiapkan pembayaran", pending: "Menunggu pembayaran", paid: "Pembayaran terverifikasi", failed: "Gagal", expired: "Kedaluwarsa" };
export function SandboxPaymentOrders() {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    fetch("/api/payments/orders", { cache: "no-store" }).then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      if (active) { setOrders(body.orders); setError(""); }
    }).catch(error => { if (active) setError(error instanceof Error ? error.message : "Tidak dapat memuat pesanan."); });
    return () => { active = false; };
  }, [retry]);
  return <section aria-label="Pesanan Sandbox Duitku" className="mb-8 space-y-3">
    <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Pesanan Sandbox Duitku</h2><Button asChild variant="outline" size="pill-sm"><Link href="/deteksi-ai">Buat Pesanan</Link></Button></div>
    <p className="text-sm text-muted-foreground">Transaksi uji tersimpan di akunmu. Pemeriksaan dokumen dan pengiriman laporan belum dijalankan.</p>
    {error ? <div role="alert" className="text-sm text-destructive">{error}<Button variant="ghost" size="pill-sm" onClick={() => setRetry(value => value + 1)}>Muat ulang</Button></div> : orders.length ? orders.map(order => <Link key={order.id} href={`/pembayaran?order=${order.id}`} className="flex items-center justify-between gap-4 rounded-2xl border p-4"><div className="min-w-0"><p className="truncate text-sm font-medium">{order.document_name}</p><p className="mt-1 break-all text-xs text-muted-foreground">{order.id}</p></div><div className="shrink-0 text-right"><p className={`text-xs ${order.status === "paid" ? "text-emerald-700" : "text-muted-foreground"}`}>{labels[order.status]}</p><p className="mt-1 text-sm">{formatRupiah(order.amount)}</p></div></Link>) : <p className="text-sm text-muted-foreground">Belum ada pesanan Sandbox.</p>}
  </section>;
}
