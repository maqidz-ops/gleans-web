"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, Copy, Download, FileText, Plus, Search, Trash2, Pencil, ArrowUpRight, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCopy } from "@/hooks/use-copy";

import { toast } from "sonner";
import { extractDoi, fetchCslByDoi, isUrl, searchWorks } from "@/lib/citation/resolve";
import { emptyDraft, fromDraft, toDraft } from "@/lib/citation/editor";
import { STYLE_LABEL, type CslItem, type CitationStyle, type Source } from "@/lib/citation/types";
import type { FormattedEntry } from "@/lib/citation/format";

type Reference = ReturnType<typeof toDraft> & { id: string; csl: CslItem };
const reference = (csl: CslItem): Reference => ({ ...toDraft(csl), id: csl.id, csl });
const blank = emptyDraft;
function sameSource(a: Reference, b: Reference) {
  return a.id === b.id || (!!a.doi && a.doi.toLowerCase() === b.doi.toLowerCase());
}
const fieldClass = "mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

export function CiteWorkspace() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [sources, setSources] = useState<Reference[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [results, setResults] = useState<Reference[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<FormattedEntry[]>([]);
  const [formatting, setFormatting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formatError, setFormatError] = useState("");
  const request = useRef(0);
  const [style, setStyle] = useState("APA 7");
  const styleKey: CitationStyle = style === "IEEE" ? "ieee" : style === "Vancouver" ? "vancouver" : "apa";

  const [view, setView] = useState("Daftar pustaka");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(blank);
  const { copy, copiedKey } = useCopy();
  const ordered = entries.map((entry) => sources.find((s) => s.id === entry.id)).filter((s): s is Reference => !!s);
  function citation(s: Reference) {
    const entry = entries.find((e) => e.id === s.id);
    return (view === "Dalam teks" ? entry?.inText : entry?.text) ?? "";
  }
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem("gleans:citations:v1") ?? "[]");
      if (!Array.isArray(saved) || saved.some((s) => !s?.csl || typeof s.csl.id !== "string" || typeof s.csl.type !== "string")) throw new Error();
      setSources(saved.map((s: Source) => reference(s.csl)));
      const savedStyle = JSON.parse(localStorage.getItem("gleans:citation-style") ?? '"apa"') as CitationStyle;
      setStyle(STYLE_LABEL[savedStyle] ?? "APA 7");
    } catch { setStorageError("Data tersimpan tidak dapat dibaca. Daftar baru akan disimpan saat kamu mengubahnya."); }
    setHydrated(true);
    return () => { request.current += 1; };
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("gleans:citations:v1", JSON.stringify(sources.map((s) => ({ id: s.id, csl: s.csl, addedAt: Date.now() }))));
      localStorage.setItem("gleans:citation-style", JSON.stringify(styleKey));
    } catch { setStorageError("Penyimpanan browser tidak tersedia. Unduh daftar pustaka sebelum menutup halaman."); }
  }, [sources, styleKey, hydrated]);
  useEffect(() => {
    let active = true;
    setEntries([]); setFormatError(""); setFormatting(true);
    import("@/lib/citation/format").then(({ formatBibliography }) => {
      const next = formatBibliography(sources.map((s) => s.csl), styleKey);
      if (active) setEntries(next);
    }).catch(() => { if (active) setFormatError("Sitasi belum dapat diformat. Periksa metadata sumber."); })
      .finally(() => { if (active) setFormatting(false); });
    return () => { active = false; };
  }, [sources, styleKey]);
  async function search(value = query) {
    if (!value.trim()) { setSearched(true); setError("Masukkan judul, DOI, atau URL terlebih dahulu."); return; }
    const current = ++request.current;
    setSearching(true); setError(""); setResults([]); setSearched(true);
    try {
      const doi = extractDoi(value);
      if (doi) { const csl = await fetchCslByDoi(doi); if (current === request.current) setResults([reference(csl)]); }
      else if (isUrl(value)) {
        const url = new URL(value.startsWith("www.") ? `https://${value}` : value);
        setEditing(null); setDraft({ ...blank, kind: "Website", url: url.href }); setDialog(true);
        setError("Lengkapi judul, penulis, dan tanggal terbit website pada formulir.");
      } else {
        const candidates = await searchWorks(value.trim());
        if (current === request.current) setResults(candidates.map((c) => reference(c.csl)));
      }
    } catch (failure) { if (current === request.current) setError(failure instanceof Error ? failure.message : "Pencarian gagal. Coba lagi."); }
    finally { if (current === request.current) setSearching(false); }
  }
  async function download() {
    setExporting(true);
    try {
      const { bibliographyDocx } = await import("@/lib/citation/export");
      const blob = await bibliographyDocx(entries, styleKey);
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = `daftar-pustaka-${styleKey}.docx`; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch { toast.error("Ekspor gagal. Silakan coba lagi."); }
    finally { setExporting(false); }
  }
  function openEditor(source?: Reference) {
    setEditing(source?.id ?? null); setDraft(source ?? blank); setDialog(true);
  }
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <section aria-label="Sumber referensi" className="flex h-[420px] min-w-0 flex-col gap-5 overflow-hidden rounded-[24px] bg-surface p-4 md:h-[450px]">
          <form onSubmit={(e) => { e.preventDefault(); void search(); }} className="flex shrink-0 items-center gap-2 rounded-full border bg-white p-1.5 pl-4 focus-within:border-primary">
            <input aria-label="Judul, DOI, atau URL" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari judul, DOI, atau URL…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            <Button type="submit" size="icon-lg" className="size-11 rounded-full" aria-label="Cari sumber" disabled={searching}>{searching ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}</Button>
          </form>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1" tabIndex={0} aria-label="Hasil pencarian sumber">
            {searched ? <div className="flex flex-col gap-3"><div className="flex items-center justify-between"><p className="text-sm font-medium">Hasil pencarian</p><span className="text-xs text-muted-foreground">{results.length} sumber</span></div>{searching && <p role="status" className="text-sm text-muted-foreground">Mencari sumber…</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{!searching && !error && !results.length && <p className="text-sm text-muted-foreground">Sumber tidak ditemukan. Coba judul yang lebih lengkap atau tambahkan manual.</p>}{results.map((s) => <article key={s.id} className="rounded-2xl bg-white p-4"><span className="text-xs font-medium text-primary">{s.kind.toUpperCase()} · {s.year || "Tanpa tahun"}</span><h3 className="mt-2 text-sm font-medium leading-relaxed">{s.title}</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.author || "Tanpa penulis"} · {s.journal}</p>{s.doi && <p className="mt-1 break-all text-xs text-muted-foreground">DOI: {s.doi}</p>}<Button variant="ghost" className="mt-3 h-9 px-0 text-primary hover:bg-transparent" disabled={!hydrated || sources.some((item) => sameSource(item, s))} onClick={() => setSources((items) => items.some((item) => sameSource(item, s)) ? items : [...items, s])}>{sources.some((item) => sameSource(item, s)) ? <><Check />Ditambahkan</> : <><Plus />Tambah sumber</>}</Button></article>)}</div> : <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-center"><span className="flex size-16 items-center justify-center rounded-2xl bg-white text-primary"><BookOpen className="size-7" strokeWidth={1.5} /></span><h3 className="mt-2 font-medium">Referensi yang tepat, tulisan yang kuat</h3><p className="max-w-xs text-sm leading-relaxed text-muted-foreground">Temukan artikel lewat judul, atau masukkan sumbermu sendiri.</p><button type="button" className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline" onClick={() => { setQuery("Attention is all you need"); void search("Attention is all you need"); }}>Cari artikel pertama<ArrowUpRight className="size-4" /></button></div>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-[28px] bg-white p-2 pl-4"><p className="text-sm">{results.length} sumber ditemukan</p><Button size="pill-sm" disabled={!hydrated} onClick={() => openEditor()}><Plus />Tambah manual</Button></div>
        </section>
        <section aria-label="Daftar pustaka" className="flex h-[420px] min-w-0 flex-col gap-5 overflow-hidden rounded-[24px] bg-surface p-4 md:h-[450px]">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3"><div role="group" aria-label="Tampilan sitasi" className="flex w-fit max-w-full rounded-full border bg-white p-1">{["Daftar pustaka", "Dalam teks"].map((v) => <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`rounded-full px-4 py-2 text-sm transition-colors ${view === v ? "bg-primary text-white" : "text-muted-foreground hover:text-primary"}`}>{v}</button>)}</div><Select value={style} onValueChange={setStyle}><SelectTrigger aria-label="Gaya sitasi" className="w-fit min-w-0 gap-2 rounded-full bg-white px-3 font-medium data-[size=default]:h-10"><SelectValue /></SelectTrigger><SelectContent position="popper" align="end" className="rounded-xl">{["APA 7", "IEEE", "Vancouver"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1" tabIndex={0} aria-label="Daftar sitasi tersimpan" aria-live="polite">{formatting ? <p role="status" className="text-sm text-muted-foreground">Memformat sitasi…</p> : formatError ? <p role="alert" className="text-sm text-destructive">{formatError}</p> : sources.length ? <ol className="flex flex-col gap-3">{ordered.map((s, i) => <li key={s.id} className="rounded-2xl bg-white p-4"><div className="mb-3 flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")} · {s.kind}</span><div className="flex gap-1"><Button variant="ghost" size="icon" aria-label={`Edit ${s.title}`} onClick={() => openEditor(s)}><Pencil /></Button><Button variant="ghost" size="icon" aria-label={`Hapus ${s.title}`} onClick={() => setSources((items) => items.filter((item) => item.id !== s.id))}><Trash2 /></Button></div></div><p className="break-words text-sm leading-7">{citation(s)}</p><button className="mt-3 flex items-center gap-2 text-xs text-primary" onClick={() => copy(citation(s), s.id)}>{copiedKey === s.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}Salin sitasi</button></li>)}</ol> : <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-center"><span className="flex size-16 items-center justify-center rounded-2xl bg-white text-primary"><FileText className="size-7" strokeWidth={1.5} /></span><h3 className="mt-2 font-medium">Mulai daftar pustaka pertamamu</h3><p className="max-w-xs text-sm leading-relaxed text-muted-foreground">Tambahkan sumber dari panel pencarian. Pratinjau sitasinya akan muncul di sini.</p></div>}</div>
          {storageError && <p role="alert" className="text-xs leading-relaxed text-destructive">{storageError}</p>}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-[28px] bg-white p-2 pl-4"><span className="text-sm">{sources.length} sumber</span><div className="flex gap-1"><Button variant="ghost" size="icon-lg" disabled={!entries.length || formatting || exporting} onClick={download} title="Unduh daftar pustaka DOCX" aria-label="Unduh daftar pustaka DOCX">{exporting ? <Loader2 className="animate-spin" /> : <Download />}</Button><Button size="pill-sm" disabled={!entries.length || formatting} onClick={() => copy(ordered.map(citation).join("\n\n"), "all")}>{copiedKey === "all" ? <Check /> : <Copy />}Salin semua</Button></div></div>
        </section>
      </div>
      <Dialog open={dialog} onOpenChange={setDialog}><DialogContent className="max-h-[85dvh] overflow-y-auto rounded-[24px] sm:max-w-lg"><DialogHeader><DialogTitle>{editing ? "Edit sumber" : "Tambah sumber manual"}</DialogTitle><DialogDescription>Pisahkan penulis dengan titik koma; gunakan Nama belakang, Nama depan. Kosongkan jika tidak diketahui.</DialogDescription></DialogHeader><form onSubmit={(e) => { e.preventDefault(); let csl: CslItem;
        try { csl = fromDraft(draft, editing ?? crypto.randomUUID(), sources.find((s) => s.id === editing)?.csl); }
        catch (failure) { toast.error((failure as Error).message); return; }
        if (csl.DOI && sources.some((s) => s.id !== editing && s.csl.DOI?.toLowerCase() === csl.DOI?.toLowerCase())) { toast.info("DOI ini sudah ada di daftar pustaka."); return; }
        const source = reference(csl);
        setSources((items) => editing ? items.map((s) => s.id === editing ? source : s) : [...items, source]); setDialog(false); }} className="flex flex-col gap-4"><label className="text-sm">Jenis sumber<select className={fieldClass} value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })}>{["Jurnal", "Buku", "Website"].map((v) => <option key={v}>{v}</option>)}</select></label>{([{ key: "title", label: "Judul", placeholder: "Judul sumber", required: true }, { key: "author", label: "Penulis", placeholder: "Pratama, Andi; Putri, Nina", required: false }, { key: "year", label: "Tahun", placeholder: "2024", required: false }, { key: "journal", label: "Nama jurnal / website", placeholder: "Nama publikasi", required: false },
{ key: "publisher", label: "Penerbit", placeholder: "Nama penerbit buku", required: false },
{ key: "volume", label: "Volume", placeholder: "12", required: false },
{ key: "issue", label: "Nomor terbitan", placeholder: "2", required: false },
{ key: "page", label: "Halaman", placeholder: "10-25", required: false },
{ key: "doi", label: "DOI", placeholder: "10.1234/artikel", required: false },
{ key: "url", label: "URL", placeholder: "https://…", required: false }] as const).map((f) => <label key={f.key} className="text-sm">{f.label}{f.required ? " *" : ""}<input required={f.required} value={draft[f.key]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} placeholder={f.placeholder} className={fieldClass} /></label>)}<Button type="submit" size="pill" className="mt-2">{editing ? "Simpan perubahan" : "Tambah ke daftar pustaka"}</Button></form></DialogContent></Dialog>
    </div>
  );
}
