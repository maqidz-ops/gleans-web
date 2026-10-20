"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Check, Clock3, Info, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@gleans/ui/button";
import { formatRupiah } from "@/lib/format";
import type { PaymentOrder } from "../types";
const labels = { draft: "Pembayaran QRIS", creating: "Menyiapkan Pembayaran", pending: "Menunggu Pembayaran", paid: "Pembayaran Berhasil", failed: "Pembayaran Gagal", expired: "Pembayaran Kedaluwarsa" };
export function PaymentCheckout() {
  const id = useSearchParams().get("order");
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    if (!id) { setLoaded(true); return; }
    try {
      const code = new URLSearchParams(window.location.hash.slice(1)).get("access");
      if (code) {
        const restored = await fetch(`/api/payments/orders/${encodeURIComponent(id)}/access`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
        if (!restored.ok) throw new Error("Tautan akses tidak valid. Gunakan kode akses yang disimpan saat memesan.");
        window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
      }
      const response = await fetch(`/api/payments/orders/${encodeURIComponent(id)}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setOrder(body.order); setError("");

    } catch (error) { setError(error instanceof Error ? error.message : "Tidak dapat memuat pembayaran."); }
    finally { setLoaded(true); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setCooldown(value => value - 1), 1000); return () => clearTimeout(timer); }, [cooldown]);
  async function act(action: "pay" | "check") {
    if (!id || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/payments/orders/${encodeURIComponent(id)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setOrder(data.order);
      await load();
      if (action === "check") setCooldown(30);
    } catch (error) { setError(error instanceof Error ? error.message : "Tidak dapat memproses pembayaran."); }
    finally { setBusy(false); }
  }
  async function restoreAccess() {
    if (!id || busy) return; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/payments/orders/${encodeURIComponent(id)}/access`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: recoveryCode.trim() }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error); await load(); setRecoveryCode(""); setNotice("Akses unduh tersimpan di browser ini.");
    } catch (error) { setError(error instanceof Error ? error.message : "Kode akses tidak valid."); } finally { setBusy(false); }
  }
  async function copyAccess() {
    if (!order?.access_code) return;
    try { await navigator.clipboard.writeText(`${window.location.origin}/pembayaran?order=${encodeURIComponent(order.id)}#access=${encodeURIComponent(order.access_code)}`); setNotice("Tautan akses disalin. Simpan secara pribadi untuk mengunduh hasil di perangkat lain."); }
    catch { setNotice(`Simpan kode akses ini secara pribadi: ${order.access_code}`); }
  }
  return <div className="w-full max-w-[460px]">
    <p className="mb-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800"><Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />Mode Sandbox Duitku. Gunakan simulasi pembayaran; hasil tersedia setelah admin mengunggah laporan pemeriksaan.</p>
    <section aria-label="Pembayaran QRIS Duitku" className="rounded-[24px] border bg-white p-4 sm:p-5">
      <div className="mx-auto flex size-[68px] items-center justify-center rounded-2xl border"><Image src="/images/logo-gleans-shield.svg" alt="Gleans Shield" width={36} height={36} /></div>
      <h1 className="mt-6 text-center text-2xl font-semibold">{order ? labels[order.status] : loaded ? "Pembayaran Gleans Shield" : "Memuat pembayaran…"}</h1>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="mt-4 break-all text-sm text-primary">{notice}</p>}
      {!id && <p className="mt-4 text-center text-sm text-muted-foreground">Buat pesanan terlebih dahulu untuk melanjutkan pembayaran.</p>}
      {order && <>
        {order.status === "draft" && <p className="mt-4 text-center text-sm text-muted-foreground">Pembayaran menggunakan QRIS. Kode QR akan dibuat sesuai total pesananmu.</p>}
        {order.status === "pending" && <div className="my-6 flex flex-col items-center gap-3">
          {order.qr_string && <div className="rounded-2xl border bg-white p-4 text-center"><QRCodeSVG value={order.qr_string} size={220} level="M" title="QRIS pembayaran Sandbox Duitku" /></div>}

          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="size-3.5" />Menunggu konfirmasi Duitku</span>
        </div>}
        {order.status === "paid" && <div className="my-6 flex justify-center"><Check className="size-12 rounded-full bg-emerald-50 p-2 text-emerald-600" aria-label="Pembayaran terverifikasi" /></div>}
        {order.status === "creating" && <p className="mt-4 text-sm text-muted-foreground">Transaksi sedang dikonfirmasi. Periksa status sebelum membuat pesanan baru. Jika tetap belum berubah, hubungi support dengan ID transaksi.</p>}
        <dl className="mt-6 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt>Dokumen</dt><dd className="min-w-0 break-words text-right">{order.document_name}</dd></div><div className="flex justify-between gap-4"><dt className="shrink-0">Nomor Invoice</dt><dd className="min-w-0 break-all text-right">{order.id}</dd></div><div className="flex justify-between gap-4"><dt>Status</dt><dd>{labels[order.status]}</dd></div>{order.expires_at && <div className="flex justify-between gap-4"><dt>Batas pembayaran</dt><dd className="text-right">{new Date(order.expires_at).toLocaleString("id-ID")}</dd></div>}<div className="flex justify-between gap-4 text-base font-semibold"><dt>Total pesanan</dt><dd>{formatRupiah(order.amount)}</dd></div></dl>
        <div className="mt-5 rounded-2xl bg-surface p-4 text-sm">
          <p className="font-medium">{order.fulfillment_status === "completed" ? "Pemeriksaan selesai" : order.fulfillment_status === "processing" ? "Dokumen sedang diperiksa" : order.fulfillment_status === "failed" ? "Pemeriksaan perlu ditinjau" : order.status === "paid" ? "Menunggu pemeriksaan" : "Pemeriksaan dimulai setelah pembayaran"}</p>
          {order.report_expires_at && <p className="mt-1 text-xs text-muted-foreground">Batas unduh: {new Date(order.report_expires_at).toLocaleString("id-ID")}</p>}
          {order.can_download && <Button asChild size="pill" className="mt-3 w-full"><a href={`/api/payments/orders/${encodeURIComponent(order.id)}/report`}>Unduh hasil PDF</a></Button>}
          {order.fulfillment_status === "completed" && order.report_expires_at && Date.parse(order.report_expires_at) <= Date.now() && <p className="mt-2 text-xs text-destructive">Masa unduh 24 jam telah berakhir.</p>}
          {order.access_code ? <Button variant="outline" size="pill-sm" className="mt-3" onClick={() => void copyAccess()}>Salin tautan akses</Button> : !order.has_access && <div className="mt-3 space-y-2"><label htmlFor="order-access" className="block text-xs">Kode akses pesanan (untuk unduh di perangkat lain)</label><input id="order-access" type="password" maxLength={43} spellCheck={false} autoComplete="off" value={recoveryCode} onChange={event => setRecoveryCode(event.target.value)} className="h-10 w-full rounded-xl border bg-white px-3 text-sm" /><Button size="pill-sm" variant="outline" disabled={busy || !recoveryCode.trim()} onClick={() => void restoreAccess()}>Buka akses unduh</Button></div>}
        </div>
        {order.status === "draft" && <Button size="pill" className="mt-6 w-full" disabled={busy} onClick={() => void act("pay")}>{busy && <Loader2 className="size-4 animate-spin" />}Tampilkan QRIS</Button>}
        {order.status === "pending" && order.payment_url && <Button asChild size="pill" className="mt-6 w-full"><a href={order.payment_url} target="_blank" rel="noopener noreferrer">Buka Halaman QRIS Duitku</a></Button>}
        {order.status === "paid" && order.fulfillment_status !== "completed" && <Button variant="outline" size="pill" className="mt-3 w-full" onClick={() => void load()}>Perbarui status pemeriksaan</Button>}
        {["pending", "creating"].includes(order.status) && <Button variant="outline" size="pill" className="mt-3 w-full" disabled={busy || cooldown > 0} onClick={() => void act("check")}><RotateCcw className={busy ? "animate-spin" : ""} />{cooldown ? `Periksa lagi dalam ${cooldown} detik` : "Periksa Status Pembayaran"}</Button>}
      </>}
      {!order && id && loaded && <Button variant="outline" className="mt-4 w-full" onClick={() => void load()}>Muat Ulang</Button>}
      <Link href={order ? "/cek-pesanan" : "/deteksi-ai"} className="mt-6 block text-center text-sm text-primary">{order ? "Lihat pesanan saya" : "Buat pesanan"}</Link>
    </section>
  </div>;
}
