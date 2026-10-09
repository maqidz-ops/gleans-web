"use client";

import { Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import { type AdminState, type RecordData } from "@/lib/admin/model";

type Blog = AdminState["blogs"][number];
type Promo = AdminState["promos"][number];
const cell = "px-4 py-5 text-left align-top";

function Badge({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${active ? "bg-emerald-50 text-emerald-700" : "bg-surface text-muted-foreground"}`}>{children}</span>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return <button type="button" role="switch" aria-label={label} aria-checked={checked} onClick={onChange} className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${checked ? "bg-primary" : "bg-muted"}`}><span className={`size-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}/></button>;
}

function day(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${value}T00:00:00+07:00`));
}
function campaignStatus(p: Promo) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (!p.active) return "Nonaktif";
  if (today < p.start) return "Terjadwal";
  if (today > p.end) return "Berakhir";
  return "Aktif";
}

export function AdminContentTable({ module, items, onEdit, onPreview, onToggle }: {
  module: "blog" | "promosi";
  items: RecordData[];
  onEdit: (item: RecordData) => void;
  onPreview: (item: RecordData) => void;
  onToggle: (item: RecordData) => void;
}) {
  const isBlog = module === "blog";
  const columns = isBlog ? ["ARTIKEL", "STATUS", "UNGGULAN", "AKSI"] : ["KAMPANYE", "JENIS", "PERIODE", "STATUS", "AKTIFKAN", "AKSI"];
  return <>
    <p className="mb-3 text-xs text-muted-foreground sm:hidden">Geser tabel untuk melihat semua kolom.</p>
    <div role="region" aria-label={`Tabel ${isBlog ? "blog" : "promosi"}`} tabIndex={0} className="overflow-x-auto rounded-2xl border outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <table className={`w-full text-sm ${isBlog ? "min-w-[700px]" : "min-w-[880px]"}`}>
        <caption className="sr-only">Daftar {isBlog ? "artikel" : "promosi"} demo Gleans.</caption>
        <thead className="bg-surface text-xs text-muted-foreground"><tr>{columns.map(x => <th key={x} scope="col" className={`whitespace-nowrap px-4 py-4 text-left font-medium ${x === "AKSI" ? "sticky right-0 bg-surface" : ""}`}>{x}</th>)}</tr></thead>
        <tbody className="divide-y">{items.map(item => {
          const blog = isBlog ? item as Blog : undefined;
          const promo = !isBlog ? item as Promo : undefined;
          const title = blog?.title || promo?.name || "";
          const status = promo ? campaignStatus(promo) : blog?.status || "";
          return <tr key={item.id} className="hover:bg-surface/50">
            <td className={cell+" min-w-64 max-w-md"}><p className="break-words font-semibold">{title}</p><p className="mt-1 break-all text-xs text-muted-foreground">{blog ? `/blog/${blog.slug}` : promo?.title}</p>{blog?.summary && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{blog.summary}</p>}{promo?.type === "Kode promo" && <p className="mt-2 text-xs text-primary">{promo.code} · {formatRupiah(promo.discount)}</p>}</td>
            {promo && <><td className={cell+" whitespace-nowrap"}>{promo.type}</td><td className={cell+" whitespace-nowrap text-xs leading-6"}>{day(promo.start)}<br/><span className="text-muted-foreground">s.d. {day(promo.end)}</span></td></>}
            <td className={cell}><Badge active={status === "Terbit" || status === "Aktif"}>{status}</Badge></td>
            <td className={cell}><Toggle label={isBlog ? `Artikel unggulan ${title}` : `Aktifkan promosi ${title}`} checked={blog ? blog.featured : !!promo?.active} onChange={() => onToggle(item)}/></td>
            <td className={cell+" sticky right-0 border-l bg-white"}><div className="flex items-center gap-1"><Button variant="ghost" size="icon" aria-label={`Preview ${title}`} onClick={() => onPreview(item)}><Eye className="size-4"/></Button><Button variant="ghost" size="icon" aria-label={`Kelola ${title}`} onClick={() => onEdit(item)}><Pencil className="size-4"/></Button></div></td>
          </tr>;
        })}{!items.length && <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">Tidak ada hasil. Coba kata kunci atau filter lain.</td></tr>}</tbody>
      </table>
    </div>
  </>;
}
