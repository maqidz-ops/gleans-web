"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Check, Clock3, Info, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";

type PreviewStatus = "pending" | "paid" | "expired" | "failed";
import { CHECKOUT_PREVIEW_KEY, type CheckoutSummary } from "@/lib/payment-preview";
const sample: CheckoutSummary = { id: "GLS-883562GDRF", amount: 10000, document: "" };
const states = {
  pending: { title: "Menunggu Pembayaran", description: "Silakan scan QRIS untuk melakukan pembayaran.", label: "Menunggu" },
  paid: { title: "Pembayaran Berhasil", description: "Pembayaran diterima. Dokumen siap masuk antrean pemeriksaan.", label: "Berhasil" },
  expired: { title: "Pembayaran Kedaluwarsa", description: "Waktu pembayaran telah berakhir. Buat pesanan kembali untuk melanjutkan.", label: "Kedaluwarsa" },
  failed: { title: "Pembayaran Gagal", description: "Pembayaran belum berhasil. Silakan coba kembali.", label: "Gagal" },
};

export function PaymentCheckout() {
  const [summary, setSummary] = useState(sample);
  const [status, setStatus] = useState<PreviewStatus>("pending");
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(CHECKOUT_PREVIEW_KEY);
      if (!saved) return;
      const value = JSON.parse(saved);
      if (typeof value.id === "string" && typeof value.document === "string" && Number.isSafeInteger(value.amount) && value.amount >= 0) setSummary(value);
    } catch { /* A direct visit can always use the sample checkout. */ }
  }, []);
  const current = states[status];
  return <div className="w-full max-w-[460px]">
    <section aria-label="Pembayaran QRIS" className="rounded-[24px] border bg-white p-4 sm:p-5">
      <div className="mx-auto flex size-[68px] items-center justify-center rounded-2xl border">
        <Image src="/images/logo-gleans-shield.svg" alt="Gleans Shield" width={36} height={36} />
      </div>
      <div aria-live="polite" className="mt-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{current.title}</h1>
        <p className="mt-2 text-sm leading-relaxed sm:text-base">{current.description}</p>
      </div>
      {status === "pending" ? <div className="my-6 flex flex-col items-center gap-3">
        <div className="rounded-2xl border bg-white p-2.5" aria-label="Contoh kode QR untuk pratinjau">
          <QRCodeSVG value={`GLEANS-UI-PREVIEW:${summary.id}`} size={180} level="M" />
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="size-3.5" />Menunggu konfirmasi pembayaran</span>
      </div> : <div className="my-8 flex justify-center"><span className={`flex size-20 items-center justify-center rounded-full ${status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{status === "paid" ? <Check className="size-10" /> : status === "expired" ? <Clock3 className="size-10" /> : <X className="size-10" />}</span></div>}
      <dl className="space-y-3 text-sm sm:text-base">
        {summary.document && <div className="flex items-start justify-between gap-5"><dt className="shrink-0 text-muted-foreground">Dokumen</dt><dd className="min-w-0 break-words text-right">{summary.document}</dd></div>}
        <div className="flex justify-between gap-4"><dt>ID Transaksi</dt><dd className="break-all text-right">{summary.id}</dd></div>
        <div className="flex justify-between gap-4"><dt>Status</dt><dd>{current.label}</dd></div>
        <div className="flex justify-between gap-4 text-base font-semibold sm:text-lg"><dt>Total Pembayaran</dt><dd className="whitespace-nowrap">{formatRupiah(summary.amount)}</dd></div>
      </dl>
      {status === "pending" ? <Button size="pill" className="mt-6 w-full font-normal" onClick={() => toast.info("Pratinjau pembayaran. Pembayaran DOKU akan tersedia setelah integrasi diaktifkan.")}>Bayar Sekarang</Button> : status === "failed" ? <Button size="pill" className="mt-6 w-full" onClick={() => setStatus("pending")}><RotateCcw />Coba Lagi</Button> : <Button asChild size="pill" className="mt-6 w-full"><Link href="/deteksi-ai">{status === "paid" ? "Kembali ke Gleans Shield" : "Buat Pesanan Kembali"}</Link></Button>}
    </section>
    <p className="mt-4 flex items-start gap-2 px-1 text-xs leading-relaxed text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" />Pratinjau UI. QR ini hanya contoh dan tidak dapat digunakan untuk pembayaran.</p>
    <details className="mt-4 rounded-2xl border p-4 text-sm">
      <summary className="cursor-pointer text-muted-foreground">Pratinjau status pembayaran</summary>
      <label className="mt-3 block"><span className="sr-only">Status pratinjau</span><select aria-label="Status pratinjau" className="h-11 w-full rounded-xl border bg-white px-3" value={status} onChange={e => setStatus(e.target.value as PreviewStatus)}>{Object.entries(states).map(([key, state]) => <option key={key} value={key}>{state.label}</option>)}</select></label>
    </details>
  </div>;
}
