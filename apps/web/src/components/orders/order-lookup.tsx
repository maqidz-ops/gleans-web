"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@gleans/ui/button";
import { formatBytes, formatRupiah } from "@/lib/format";
import { orderStatusLabels, parseOrderLookup, type PublicLookupOrder } from "@/features/orders/lib/lookup";

export function OrderLookup() {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<PublicLookupOrder[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setOrders([]); setError(""); setSearched(false);
    if (!parseOrderLookup(query)) {
      setError("Masukkan nomor invoice atau nomor WhatsApp yang valid.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/payments/orders/lookup", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Pesanan belum dapat dicari.");
      setOrders(body.orders); setSearched(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Pesanan belum dapat dicari. Silakan coba kembali.");
    } finally { setBusy(false); }
  }

  return (
    <section className="container-page flex flex-1 flex-col pt-8 pb-16 md:pt-12 lg:pt-16">
      <form className="bg-surface mx-auto flex h-14 w-full max-w-[720px] items-center gap-2 rounded-full pr-1 pl-5" onSubmit={search} aria-busy={busy}>
        <Search className="text-muted-foreground size-5 shrink-0" aria-hidden />
        <input value={query} onChange={(event) => { setQuery(event.target.value); setOrders([]); setSearched(false); setError(""); }}
          disabled={busy} maxLength={100} placeholder="Masukkan nomor invoice atau No. WhatsApp"
          aria-label="Nomor invoice atau No. WhatsApp" aria-invalid={Boolean(error)}
          className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none md:text-base" />
        <Button type="submit" size="pill-sm" disabled={busy || !query.trim()} className="shrink-0 px-4 font-normal sm:px-5">
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}{busy ? "Mencari…" : "Cari"}
        </Button>
      </form>
      <div aria-live="polite" aria-atomic="true" className="mx-auto mt-5 w-full max-w-[720px]">
        {error && <div role="alert" className="rounded-2xl border p-4 text-center text-sm"><p className="text-destructive">{error}</p></div>}
        {searched && orders.length > 0 && <>
          <h1 className="mb-4 text-lg font-semibold">{orders.length} pesanan ditemukan</h1>
          {orders.length === 30 && <p className="mb-4 text-sm text-muted-foreground">Menampilkan 30 pesanan terbaru. Gunakan nomor invoice untuk mencari pesanan tertentu.</p>}
          <div className="mb-5 flex flex-wrap gap-2 text-xs"><span className="rounded-full border px-3 py-2">{orders.length} Total</span><span className="rounded-full border px-3 py-2 text-emerald-700">{orders.filter(order => order.fulfillment_status === "completed").length} Selesai</span><span className="rounded-full border px-3 py-2 text-amber-700">{orders.filter(order => order.status !== "paid").length} Belum dibayar</span></div>
          <div className="space-y-3">{orders.map((order, index) => <article key={`${order.id}-${index}`} className="rounded-2xl border p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><h2 className="break-words font-medium">{order.document_name}</h2><p className="mt-1 break-all text-xs text-muted-foreground">Nomor Invoice: {order.id}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("id-ID")}{order.document_bytes ? ` · ${formatBytes(order.document_bytes)}` : ""}</p></div>{order.amount !== null && <p className="text-sm font-semibold">{formatRupiah(order.amount)}</p>}</div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className={`rounded-full px-3 py-1 text-xs ${order.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-surface text-muted-foreground"}`}>{order.status === "paid" ? order.fulfillment_status === "completed" ? "Pemeriksaan selesai" : order.fulfillment_status === "processing" ? "Sedang diperiksa" : "Menunggu pemeriksaan" : orderStatusLabels[order.status]}</span><Button asChild variant="outline" size="pill-sm"><a href={`/cek-pesanan/${encodeURIComponent(order.id)}`}>Detail pesanan</a></Button></div>
          </article>)}</div>
          <p className="mt-4 text-xs text-muted-foreground">Pembayaran menggunakan Sandbox Duitku. Hasil dapat diunduh setelah laporan pemeriksaan tersedia.</p>
        </>}
      </div>
      {!busy && !error && orders.length === 0 && <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <Image src="/images/empty-order.png" alt="" width={92} height={88} className="h-auto w-[80px]" />
        <div className="flex max-w-md flex-col gap-2"><h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">{searched ? "Pesanan tidak ditemukan" : "Cek pesananmu"}</h1><p className="text-muted-foreground text-sm md:text-base">{searched ? "Periksa kembali nomor invoice atau nomor WhatsApp yang kamu masukkan." : "Masukkan nomor invoice atau nomor WhatsApp untuk melihat status pembayaran pesananmu."}</p></div>
      </div>}
    </section>
  );
}
