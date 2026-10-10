"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatRupiah } from "@/lib/format";
import { type AdminState } from "@/lib/admin/model";
import { useAdmin } from "./provider";
import { shieldAccess } from "@/lib/shield-retention";
import { summaryDemo } from "@/lib/admin/summary-demo";
import { card } from "./overview";

type Order = AdminState["orders"][number];
type Customer = AdminState["customers"][number];
const control = "h-10 w-full min-w-0 rounded-xl border-0 bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary";
const cell = "px-4 py-5 text-left align-top";

function Status({ value }: { value: string }) {
  const color = ["Berhasil", "Selesai", "Terkirim"].includes(value)
    ? "bg-emerald-50 text-emerald-700"
    : ["Gagal", "Gagal dikirim", "Kedaluwarsa"].includes(value)
      ? "bg-red-50 text-red-700"
      : ["Antre", "Diproses", "Menunggu"].includes(value)
        ? "bg-accent text-primary"
        : "bg-surface text-muted-foreground";
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${color}`}>{value}</span>;
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-2 break-words text-sm font-medium">{children}</dd></div>;
}

function date(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(`${value}T00:00:00+07:00`));
}

export function AdminRecordsTable({ module }: { module: "pesanan" | "pelanggan" }) {
  const { state } = useAdmin();
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
  const router = useRouter();
  const params = useSearchParams();
  const opened = useRef<string | null>(null);
  const [query, setQuery] = useState("");
  const [payment, setPayment] = useState("Semua");
  const [processing, setProcessing] = useState(params.get("status") === "proses" ? "Berjalan" : params.get("status") === "selesai" ? "Selesai" : params.get("status") === "retry" ? "Retry" : "Semua");
  const [delivery, setDelivery] = useState("Semua");
  const [attention, setAttention] = useState(params.get("status") === "gagal");
  const [selected, setSelected] = useState<string | null>(null);
  const isOrder = module === "pesanan";
  const title = isOrder ? "Pesanan" : "Pelanggan";
  const customerFor = (id: string) => state.customers.find(c => c.id === id);
  const order = isOrder ? state.orders.find(o => o.id === selected) : undefined;
  const customer = isOrder ? customerFor(order?.customerId || "") : customerFor(selected || "");

  useEffect(() => {
    const id = params.get("detail");
    if (!id) opened.current = null;
    if (id && opened.current !== id) { opened.current = id; setSelected(id); }
  }, [params]);

  function close() {
    setSelected(null);
    if (params.get("detail")) {
      const next = new URLSearchParams(params.toString());
      next.delete("detail");
      router.replace(`/admin/${module}${next.size ? `?${next}` : ""}`, { scroll: false });
    }
  }
  const needle = query.trim().toLowerCase();
  const orders = state.orders.filter(o => {
    const c = customerFor(o.customerId);
    return [o.id, o.document, c?.name, c?.email, c?.whatsapp].join(" ").toLowerCase().includes(needle)
      && (payment === "Semua" || o.payment === payment)
      && (processing === "Semua" || o.processing === processing || processing === "Berjalan" && ["Antre", "Diproses"].includes(o.processing) || processing === "Retry" && o.failureReason === "rate_limit" && o.processing === "Antre")
      && (delivery === "Semua" || o.delivery === delivery)
      && (!attention || o.processing === "Gagal" || o.delivery === "Gagal dikirim");
  });
  const customers = state.customers.filter(c => [c.id, c.name, c.email, c.whatsapp].join(" ").toLowerCase().includes(needle));
  const count = isOrder ? orders.length : customers.length;
  const metrics = isOrder ? [
    ["TOTAL PENDAPATAN", formatRupiah(summaryDemo.income)],
    ["TOTAL PESANAN", new Intl.NumberFormat("id-ID").format(summaryDemo.orders)],
    ["TOTAL ANTREAN", summaryDemo.queue],
    ["TOTAL GAGAL", state.orders.filter(o => o.processing === "Gagal" || o.delivery === "Gagal dikirim").length],
  ] : [
    ["TOTAL PELANGGAN", state.customers.length],
    ["TOTAL SALDO", formatRupiah(state.customers.reduce((sum, c) => sum + c.balance, 0))],
    ["TOTAL KUOTA", state.customers.reduce((sum, c) => sum + c.quota, 0)],
    ["PELANGGAN DENGAN PESANAN", state.customers.filter(c => state.orders.some(o => o.customerId === c.id)).length],
  ];

  return <>
    <div className="mb-7"><h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{isOrder ? "Pantau pembayaran, pemeriksaan, dan pengiriman laporan. Buka detail untuk melihat informasi pesanan." : "Lihat profil, saldo, kuota, dan riwayat pesanan pelanggan."}</p></div>
    <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value]) => <section key={label} className={card}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-4 break-words text-2xl font-semibold">{value}</p></section>)}</div>
    <div className="min-w-0 w-full">
      <div className="mb-5 grid gap-3">
        <div className={`flex ${isOrder ? "h-10" : "h-11"} min-w-0 items-center gap-2 rounded-xl bg-surface px-4`}><Search className="size-4 shrink-0 text-muted-foreground"/><input aria-label={`Cari ${title}`} placeholder={isOrder ? "Cari ID, dokumen, nama, atau WhatsApp…" : "Cari nama, email, ID, atau WhatsApp…"} value={query} onChange={e => setQuery(e.target.value)} className="w-full min-w-0 bg-transparent text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"/></div>
        {isOrder && <div className="grid gap-3 sm:grid-cols-3">
          <select aria-label="Filter pembayaran" value={payment} onChange={e => setPayment(e.target.value)} className={control}><option value="Semua">Semua pembayaran</option>{["Menunggu", "Berhasil", "Kedaluwarsa", "Refund"].map(x => <option key={x}>{x}</option>)}</select>
          <select aria-label="Filter pemeriksaan" value={processing} onChange={e => setProcessing(e.target.value)} className={control}><option value="Semua">Semua pemeriksaan</option><option value="Berjalan">Antre & diproses</option><option value="Retry">Menunggu retry</option>{["Belum diproses", "Antre", "Diproses", "Selesai", "Gagal"].map(x => <option key={x}>{x}</option>)}</select>
          <select aria-label="Filter laporan" value={delivery} onChange={e => setDelivery(e.target.value)} className={control}><option value="Semua">Semua laporan</option>{["Belum dikirim", "Terkirim", "Gagal dikirim"].map(x => <option key={x}>{x}</option>)}</select>
        </div>}
        {isOrder && <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={attention} onChange={e => setAttention(e.target.checked)}/>Hanya yang perlu tindakan</label>}
      </div>
      <div className="mb-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><p>{count} {title.toLowerCase()} ditemukan</p><p className="sm:hidden">Geser tabel untuk melihat semua kolom.</p></div>
      <div role="region" aria-label={`Tabel ${title.toLowerCase()}`} tabIndex={0} className={`overflow-x-auto rounded-2xl border outline-none focus-visible:ring-2 focus-visible:ring-primary`}>
        <table className={`w-full text-sm ${isOrder ? "min-w-[1060px]" : "min-w-[840px]"}`}>
          <caption className="sr-only">Daftar {title.toLowerCase()} demo. Gunakan tombol Detail untuk melihat informasi.</caption>
          <thead className="bg-surface text-xs text-muted-foreground"><tr>{(isOrder ? ["PESANAN", "PELANGGAN", "DOKUMEN", "TOTAL", "PEMBAYARAN", "PEMERIKSAAN", "LAPORAN", "AKSI"] : ["PELANGGAN", "KONTAK", "SALDO", "KUOTA", "PESANAN", "AKSI"]).map(x => <th key={x} scope="col" className={`whitespace-nowrap px-4 py-4 text-left font-medium ${x === "AKSI" ? "sticky right-0 bg-surface" : ""}`}>{x}</th>)}</tr></thead>
          <tbody className="divide-y">
            {isOrder ? orders.map(o => {const c = customerFor(o.customerId); return <tr key={o.id} className="hover:bg-surface/50">
              <td className={cell}><p className="whitespace-nowrap font-medium">{o.id}</p><p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">{date(o.date)}</p></td>
              <td className={cell}><p className="font-medium">{c?.name || o.customerId}</p><p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">{c?.whatsapp || "—"}</p></td>
              <td className={cell+" max-w-64 break-words"}>{o.document}{o.processing === "Selesai" && <Retention order={o} now={now}/>}</td><td className={cell+" whitespace-nowrap"}>{formatRupiah(o.amount)}</td>
              <td className={cell}><Status value={o.payment}/></td><td className={cell}><Status value={o.processing}/></td><td className={cell}><Status value={o.delivery}/></td>
              <td className={cell+" sticky right-0 bg-white"}><Button variant="ghost" size="pill-sm" aria-label={`Detail pesanan ${o.id}`} onClick={() => setSelected(o.id)}><Eye className="size-4"/>Detail</Button></td>
            </tr>;}) : customers.map(c => <tr key={c.id} className="hover:bg-surface/50">
              <td className={cell}><p className="font-medium">{c.name}</p><p className="mt-1 text-xs text-muted-foreground">{c.id}</p></td>
              <td className={cell}><p>{c.email}</p><p className="mt-1 text-xs text-muted-foreground">{c.whatsapp || "—"}</p></td>
              <td className={cell+" whitespace-nowrap"}>{formatRupiah(c.balance)}</td><td className={cell}>{c.quota}</td><td className={cell}>{state.orders.filter(o => o.customerId === c.id).length}</td>
              <td className={cell+" sticky right-0 border-l bg-white"}><Button variant="ghost" size="pill-sm" aria-label={`Detail pelanggan ${c.name}`} onClick={() => setSelected(c.id)}><Eye className="size-4"/>Detail</Button></td>
            </tr>)}
            {!count && <tr><td colSpan={isOrder ? 8 : 6} className="px-4 py-12 text-center text-muted-foreground">Tidak ada hasil. Coba kata kunci atau filter lain.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
    <Dialog open={!!selected} onOpenChange={v => {if (!v) close();}}><DialogContent className="max-h-[85dvh] overflow-y-auto rounded-[24px] sm:max-w-2xl">
      <DialogHeader><DialogTitle>{isOrder ? "Detail pesanan" : "Detail pelanggan"}</DialogTitle><DialogDescription>Informasi demo untuk dilihat.</DialogDescription></DialogHeader>
      {isOrder && order ? <OrderDetail order={order} customer={customer} now={now}/> : !isOrder && customer ? <CustomerDetail customer={customer} orders={state.orders.filter(o => o.customerId === customer.id)}/> : <p className="py-6 text-sm text-muted-foreground">Data tidak ditemukan.</p>}
      <div className="flex justify-end border-t pt-4"><Button variant="outline" size="pill-sm" onClick={close}>Tutup</Button></div>
    </DialogContent></Dialog>
  </>;
}

function OrderDetail({ order, customer, now }: { order: Order; customer?: Customer; now: number }) {
  return <div className="space-y-6">
    <section className="rounded-2xl bg-surface p-4"><p className="text-xs text-muted-foreground">{order.id} · {date(order.date)}</p><h3 className="mt-2 break-words font-semibold">{order.document}</h3><p className="mt-3 text-xl font-semibold">{formatRupiah(order.amount)}</p></section>
    <dl className="grid gap-5 sm:grid-cols-2"><DetailItem label="Pelanggan">{customer?.name || order.customerId}</DetailItem><DetailItem label="ID pelanggan">{order.customerId}</DetailItem><DetailItem label="Email">{customer?.email || "—"}</DetailItem><DetailItem label="WhatsApp">{customer?.whatsapp || "—"}</DetailItem></dl>
    <dl className="grid gap-5 rounded-2xl border p-4 sm:grid-cols-3"><DetailItem label="Pembayaran"><Status value={order.payment}/></DetailItem><DetailItem label="Pemeriksaan"><Status value={order.processing}/></DetailItem><DetailItem label="Pengiriman laporan"><Status value={order.delivery}/></DetailItem></dl>
    {order.processing === "Selesai" && <section className="rounded-2xl bg-surface p-4"><h3 className="text-sm font-medium">Akses dokumen dan laporan</h3><Retention order={order} now={now} detail/></section>}
    {order.failureReason && <section className="rounded-2xl bg-amber-50 p-4"><h3 className="text-sm font-medium">{order.failureReason === "rate_limit" ? "Menunggu layanan tersedia" : "Penyebab kegagalan"}</h3><p className="mt-2 text-sm">{failureLabels[order.failureReason]}</p></section>}
    <dl><DetailItem label="Catatan operator"><span className="whitespace-pre-wrap">{order.note || "Belum ada catatan."}</span></DetailItem></dl>
  </div>;
}

function CustomerDetail({ customer, orders }: { customer: Customer; orders: Order[] }) {
  return <div className="space-y-6">
    <section className="rounded-2xl bg-surface p-4"><p className="text-xs text-muted-foreground">{customer.id}</p><h3 className="mt-2 font-semibold">{customer.name}</h3></section>
    <dl className="grid gap-5 sm:grid-cols-2"><DetailItem label="Email">{customer.email}</DetailItem><DetailItem label="WhatsApp">{customer.whatsapp || "—"}</DetailItem><DetailItem label="Total saldo">{formatRupiah(customer.balance)}</DetailItem><DetailItem label="Total kuota">{customer.quota} pemeriksaan</DetailItem></dl>
    <section><h3 className="mb-3 text-sm font-semibold">Riwayat pesanan · {orders.length}</h3><div className="space-y-3">{orders.map(o => <a key={o.id} href={`/admin/pesanan?detail=${o.id}`} className="flex min-w-0 items-start justify-between gap-3 rounded-2xl border p-4 hover:border-primary"><div className="min-w-0"><p className="break-words text-sm font-medium">{o.document}</p><p className="mt-1 text-xs text-muted-foreground">{o.id} · {date(o.date)}</p><div className="mt-3"><Status value={o.processing}/></div></div><ArrowUpRight className="size-4 shrink-0 text-primary"/><span className="sr-only">Lihat detail pesanan {o.id}</span></a>)}</div>{!orders.length && <p className="py-4 text-sm text-muted-foreground">Belum ada pesanan.</p>}</section>
  </div>;
}

const failureLabels = { api_quota: "Kuota API GPTZero habis · skenario demo", rate_limit: "Batas request GPTZero sementara tercapai · menunggu percobaan ulang", timeout: "Layanan pemeriksaan tidak merespons", invalid_document: "Dokumen tidak dapat dibaca" };
function Retention({ order, now, detail = false }: { order: Order; now: number; detail?: boolean }) {
  if (!now) return null;
  const access = shieldAccess(order.completedAt, now);
  const stamp = (value: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value)) + " WIB";
  return <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
    <p className={access.status === "expired" ? "text-red-700" : "text-amber-700"}>{access.status === "expired" ? "Masa unduh berakhir" : access.status === "available" ? `Tersedia · sisa ${Math.ceil(access.remainingMs / 3600000)} jam` : "Waktu selesai belum tercatat"}</p>
    {detail && <>{order.completedAt && <p className="mt-2">Selesai: {stamp(order.completedAt)}</p>}{access.expiresAt && <p className="mt-1">Batas unduh: {stamp(access.expiresAt)}</p>}<p className="mt-2">{access.status === "expired" ? "Dokumen dan hasil pemeriksaan tidak lagi tersedia setelah 24 jam. Riwayat pesanan tetap tersimpan." : "Pelanggan memiliki waktu 24 jam setelah proses berhasil untuk mengunduh dokumen dan hasil pemeriksaan."}</p></>}
  </div>;
}
