"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Download, FileText, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@gleans/ui/button";
import { formatBytes, formatRupiah } from "@/lib/format";
import { orderStatusLabels, parseOrderLookup } from "@/features/orders/lib/lookup";
import type { PaymentOrder } from "@/features/payments/types";

const date = (value: string) => new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }) + " WIB";

export function OrderDetail({ invoice }: { invoice: string }) {
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setBusy(true); setError("");
    const parsed = parseOrderLookup(invoice);
    if (parsed?.kind !== "invoice") { setError("Nomor invoice tidak valid."); setBusy(false); return; }
    try {
      const response = await fetch(`/api/payments/orders/${encodeURIComponent(parsed.invoice)}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Detail pesanan belum dapat dimuat.");
      setOrder(body.order);
    } catch (err) { setError(err instanceof Error ? err.message : "Detail pesanan belum dapat dimuat."); }
    finally { setBusy(false); }
  }, [invoice]);
  useEffect(() => { void load(); }, [load]);

  const paid = order?.status === "paid";
  const completed = paid && order?.fulfillment_status === "completed";
  const failed = order?.fulfillment_status === "failed";
  const closed = order?.status === "expired" || order?.status === "failed";
  const reportExpired = completed && Date.parse(order?.report_expires_at ?? "") <= Date.now();
  const status = order ? !paid ? orderStatusLabels[order.status] : completed ? "Pemeriksaan selesai" : failed ? "Pemeriksaan terkendala" : order.fulfillment_status === "processing" ? "Sedang diperiksa" : "Menunggu pemeriksaan" : "";
  const step = completed ? 3 : paid ? 2 : 1;
  const paymentHref = `/pembayaran?order=${encodeURIComponent(order?.id ?? invoice)}`;

  return <main className="container-page w-full flex-1 py-8 sm:py-12">
    <div className="mx-auto max-w-[840px]">
      <Link href="/cek-pesanan" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" />Kembali ke cek pesanan</Link>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">Gleans Shield</p><h1 className="text-3xl font-semibold tracking-tight">Detail pesanan</h1><p className="mt-2 text-sm text-muted-foreground">Pantau pembayaran, pemeriksaan, dan hasil dokumenmu.</p></div><Button variant="outline" size="pill-sm" onClick={() => void load()} disabled={busy}><RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />Perbarui status</Button></div>
      {error && <div role="alert" className="mb-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">{error}</div>}
      {busy && !order && <div role="status" className="flex items-center justify-center gap-3 rounded-3xl border py-24 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" />Memuat detail pesanan…</div>}
      {order && <article className="overflow-hidden rounded-3xl border bg-white">
        <header className="flex flex-col items-start gap-4 bg-surface p-5 sm:flex-row sm:justify-between sm:p-8"><div className="flex w-full min-w-0 gap-3 sm:w-auto sm:flex-1 sm:gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border bg-white text-primary"><FileText className="size-6" /></div><div className="min-w-0 flex-1"><h2 className="break-words text-base font-semibold sm:text-lg">{order.document_name}</h2><p className="mt-1 break-all text-sm text-muted-foreground">{order.id}</p><p className="mt-1 text-xs text-muted-foreground">Dibuat {date(order.created_at)}</p></div></div><span className={`max-w-full rounded-full px-3 py-1.5 text-xs font-medium sm:shrink-0 ${completed ? "bg-emerald-50 text-emerald-700" : closed || failed ? "bg-red-50 text-red-700" : "bg-primary/10 text-primary"}`}>{status}</span></header>
        <div className="border-b px-4 py-8 sm:px-8"><ol aria-label="Progres pesanan" className="grid grid-cols-3">{["Pembayaran", "Pemeriksaan", "Hasil tersedia"].map((label, index) => {
          const done = index + 1 < step || completed;
          const current = index + 1 === step && !completed;
          return <li key={label} aria-current={current ? "step" : undefined} className="relative flex flex-col items-center text-center">{index < 2 && <div aria-hidden className={`absolute top-4 left-1/2 h-0.5 w-full ${index + 1 < step ? "bg-primary" : "bg-border"}`} />}<span className={`relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold ${done ? "border-primary bg-primary text-white" : current ? "border-primary bg-white text-primary ring-4 ring-primary/10" : "border-border bg-white text-muted-foreground"}`}>{done ? <Check className="size-4" /> : index + 1}</span><p className={`mt-3 text-xs sm:text-sm ${current || done ? "font-medium" : "text-muted-foreground"}`}>{label}</p></li>;
        })}</ol></div>
        <div className="p-6 sm:p-8"><dl className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-2">{[
          ["Total pembayaran", formatRupiah(order.amount)],
          ["Ukuran dokumen", order.document_bytes ? formatBytes(order.document_bytes) : "—"], ["Jumlah kata", order.word_count == null ? "—" : `${order.word_count.toLocaleString("id-ID")} kata`],
          ["Status pembayaran", orderStatusLabels[order.status]],
          ...(order.expires_at && !paid ? [["Batas pembayaran", date(order.expires_at)]] : []),
          ...(order.paid_at ? [["Dibayar pada", date(order.paid_at)]] : []),
          ...(order.completed_at ? [["Selesai pada", date(order.completed_at)]] : []),
          ...(completed && order.report_expires_at ? [["Batas unduh hasil", date(order.report_expires_at)]] : []),
        ].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1.5 break-words font-medium">{value}</dd></div>)}</dl>
        <div className="mt-8 rounded-2xl bg-surface p-4 text-sm leading-relaxed"><div className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" /><p>{!paid ? closed ? "Pembayaran tidak berhasil diselesaikan. Buat pesanan baru untuk melanjutkan pemeriksaan." : "Selesaikan pembayaran QRIS agar dokumenmu dapat diperiksa." : reportExpired ? "Masa unduh hasil pesanan ini sudah berakhir." : completed ? "Laporan pemeriksaan tersedia. Unduh hasil sebelum batas waktu berakhir." : failed ? "Pemeriksaan mengalami kendala. Hubungi tim Gleans dengan menyertakan nomor invoice." : "Pembayaran sudah terverifikasi. Hasil akan tersedia di halaman ini setelah pemeriksaan selesai."}</p></div></div>
        <div className="mt-5 flex flex-wrap gap-3">{!paid && !closed && <Button asChild size="pill" className="w-full sm:w-auto"><Link href={paymentHref}>Lanjutkan pembayaran QRIS<ArrowUpRight className="size-4" /></Link></Button>}{order.can_download && <Button asChild size="pill" className="w-full sm:w-auto"><a href={`/api/payments/orders/${encodeURIComponent(order.id)}/report`}><Download className="size-4" />Unduh hasil PDF</a></Button>}{completed && !reportExpired && !order.has_access && <Button asChild size="pill" className="w-full sm:w-auto"><Link href={paymentHref}>Buka akses unduh<ArrowUpRight className="size-4" /></Link></Button>}{closed && <Button asChild size="pill" className="w-full sm:w-auto"><Link href="/deteksi-ai">Buat pesanan baru</Link></Button>}</div>
        </div>
      </article>}
    </div>
  </main>;
}
