"use client";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@gleans/ui/button";
import { uploadPaymentFile } from "@/features/payments/upload-file";
import type { PaymentOrder } from "@/features/payments/types";
import { formatBytes, formatRupiah } from "@/lib/format";
export function ShieldOrders() {
  const [orders, setOrders] = useState<(PaymentOrder & { whatsapp: string; document_bytes: number })[]>([]);
  const [error, setError] = useState(""); const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { const response = await fetch("/api/admin/shield-orders", { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setOrders(data.orders); }
    catch (error) { setError(error instanceof Error ? error.message : "Pesanan belum dapat dimuat."); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function process(id: string) {
    setBusy(id); setError("");
    try { const response = await fetch(`/api/admin/shield-orders/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "process" }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); await load(); }
    catch (error) { setError(error instanceof Error ? error.message : "Gagal memperbarui pesanan."); } finally { setBusy(null); }
  }
  async function report(id: string, file?: File) {
    if (!file) return; setBusy(id); setError("");
    try { await uploadPaymentFile(file, "report", id); await load(); }
    catch (error) { setError(error instanceof Error ? error.message : "Gagal mengunggah laporan."); } finally { setBusy(null); }
  }
  return <section className="mb-8 space-y-3" aria-label="Pesanan QRIS tersimpan">
    <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Pesanan QRIS</h2><Button variant="outline" size="pill-sm" onClick={() => void load()}>Muat ulang</Button></div>
    <p className="text-sm text-muted-foreground">Pesanan pelanggan dan tamu dari Sandbox Duitku. Unggah laporan PDF sebenarnya setelah pemeriksaan selesai. Pelanggan dapat mengunduh selama 24 jam.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {orders.map(order => <article key={order.id} className="rounded-2xl border p-4">
      <div className="flex flex-wrap justify-between gap-3"><div><h3 className="break-all text-sm font-semibold">{order.document_name}</h3><p className="mt-1 text-xs text-muted-foreground">{order.id} · {formatBytes(order.document_bytes)} · {order.whatsapp}</p></div><p className="text-sm font-medium">{formatRupiah(order.amount)}</p></div>
      <p className="mt-3 text-xs text-muted-foreground">Pembayaran: {order.status} · Pemeriksaan: {order.fulfillment_status}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3"><Button asChild variant="outline" size="pill-sm"><a href={`/api/admin/shield-orders/${order.id}`} target="_blank" rel="noreferrer">Unduh dokumen</a></Button>
        {order.status === "paid" && order.fulfillment_status !== "completed" && <><Button size="pill-sm" disabled={busy !== null || order.fulfillment_status === "processing"} onClick={() => void process(order.id)}>Mulai proses</Button><label className="text-sm font-medium">{busy === order.id ? "Mengunggah…" : "Unggah hasil PDF"}<input className="mt-1 block max-w-full text-xs" type="file" accept="application/pdf,.pdf" disabled={busy !== null} aria-label={`Unggah hasil ${order.id}`} onChange={event => { void report(order.id, event.target.files?.[0]); event.target.value = ""; }} /></label></>}
        {order.fulfillment_status === "completed" && <span className="text-xs text-emerald-700">Laporan tersedia hingga {new Date(order.report_expires_at!).toLocaleString("id-ID")}</span>}
      </div>
    </article>)}
    {!orders.length && !error && <p className="text-sm text-muted-foreground">Belum ada pesanan QRIS.</p>}
  </section>;
}
