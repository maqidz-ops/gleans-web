"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Languages, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCopy } from "@/hooks/use-copy";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  CitationError,
  extractDoi,
  fetchCslByDoi,
  findBestMatch,
  isUrl,
  searchWorks,
} from "@/lib/citation/resolve";
import { STYLE_LABEL, type Candidate, type CitationStyle, type CslItem, type Source } from "@/lib/citation/types";
import type { FormattedEntry } from "@/lib/citation/format";
import { cn } from "@/lib/utils";

const URL_SOON = "Input URL segera hadir. Untuk sekarang, gunakan DOI atau judul karya.";

export function CiteGenerator() {
  const [sources, setSources, hydrated] = useLocalStorage<Source[]>("gleans:citations:v1", []);
  const [storedStyle, setStyle] = useLocalStorage<CitationStyle>("gleans:citation-style", "apa");
  const style: CitationStyle = storedStyle in STYLE_LABEL ? storedStyle : "apa";
  const [entries, setEntries] = useState<FormattedEntry[]>([]);
  const [formatting, setFormatting] = useState(false);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [bulk, setBulk] = useState("");
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

  const { copy, copiedKey } = useCopy();

  useEffect(() => {
    let cancelled = false;
    if (sources.length === 0) {
      setEntries([]);
      return;
    }
    setFormatting(true);
    import("@/lib/citation/format")
      .then(({ formatBibliography }) => {
        if (!cancelled) setEntries(formatBibliography(sources.map((s) => s.csl), style));
      })
      .catch(() => toast.error("Gagal memformat sitasi."))
      .finally(() => !cancelled && setFormatting(false));
    return () => {
      cancelled = true;
    };
  }, [sources, style]);

  function addSource(csl: CslItem) {
    let added = false;
    setSources((prev) => {
      if (prev.some((s) => s.id === csl.id)) return prev;
      added = true;
      return [...prev, { id: csl.id, csl, addedAt: Date.now() }];
    });
    return added;
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const value = query.trim();
    if (!value) return;
    const doi = extractDoi(value);
    if (!doi && isUrl(value)) {
      toast.info(URL_SOON);
      return;
    }
    setSearching(true);
    setCandidates(null);
    try {
      if (doi) {
        const csl = await fetchCslByDoi(doi);
        if (addSource(csl)) toast.success("Sumber ditambahkan.");
        else toast.info("Sumber ini sudah ada di daftar.");
        setQuery("");
      } else {
        const results = await searchWorks(value);
        if (results.length === 0) toast.error("Tidak ada karya yang cocok. Coba judul yang lebih lengkap.");
        setCandidates(results);
      }
    } catch (err) {
      toast.error(err instanceof CitationError ? err.message : "Tidak dapat terhubung ke layanan metadata.");
    } finally {
      setSearching(false);
    }
  }

  function pickCandidate(c: Candidate) {
    if (addSource(c.csl)) toast.success("Sumber ditambahkan.");
    else toast.info("Sumber ini sudah ada di daftar.");
    setCandidates(null);
    setQuery("");
  }

  async function handleBulk() {
    const lines = bulk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      toast.info("Tulis satu DOI atau judul per baris.");
      return;
    }
    setBulkProgress({ done: 0, total: lines.length });
    const failed: string[] = [];
    let urlSkipped = 0;
    for (const [i, line] of lines.entries()) {
      try {
        const doi = extractDoi(line);
        if (doi) {
          addSource(await fetchCslByDoi(doi));
        } else if (isUrl(line)) {
          urlSkipped++;
          failed.push(line);
        } else {
          const best = await findBestMatch(line);
          if (best) addSource(best.csl);
          else failed.push(line);
        }
      } catch {
        failed.push(line);
      }
      setBulkProgress({ done: i + 1, total: lines.length });
    }
    setBulkProgress(null);
    setBulk(failed.join("\n"));
    const ok = lines.length - failed.length;
    if (ok > 0) toast.success(`${ok} sumber ditambahkan.`);
    if (urlSkipped > 0) toast.info(URL_SOON);
    if (failed.length > urlSkipped) toast.error(`${failed.length - urlSkipped} baris tidak ditemukan dan dibiarkan di kolom input.`);
  }

  const allText = useMemo(() => entries.map((e) => e.text).join("\n"), [entries]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto w-full max-w-[680px]">
        <form
          onSubmit={handleSearch}
          className="bg-surface flex items-center gap-2 rounded-full p-1.5 pl-1.5 ring-1 ring-transparent focus-within:ring-primary/30"
        >
          <Button
            type="submit"
            size="icon-lg"
            className="size-10 shrink-0 rounded-full"
            aria-label="Cari sumber"
            disabled={searching}
          >
            {searching ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}
          </Button>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Masukkan DOI atau judul karya"
            aria-label="DOI atau judul karya"
            className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none md:text-base"
          />
          <Select value={style} onValueChange={(v) => v in STYLE_LABEL && setStyle(v as CitationStyle)}>
            <SelectTrigger
              aria-label="Gaya sitasi"
              className="h-10 shrink-0 gap-2 rounded-full border-0 bg-white px-3 font-semibold shadow-xs md:px-4"
            >
              <Languages className="size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" className="rounded-xl">
              {(Object.keys(STYLE_LABEL) as CitationStyle[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STYLE_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </form>

        <div className="text-muted-foreground mt-3 flex flex-wrap items-center justify-center gap-2 text-xs md:text-sm">
          <span className="rounded-full border bg-white px-3 py-1">DOI</span>
          <span className="rounded-full border bg-white px-3 py-1">Judul karya</span>
          <span className="rounded-full border border-dashed px-3 py-1">URL · Segera Hadir</span>
        </div>

        {candidates && candidates.length > 0 && (
          <div className="absolute inset-x-0 top-[64px] z-20 rounded-2xl border bg-white p-2 shadow-xl">
            <div className="flex items-center justify-between px-3 pt-1 pb-2">
              <p className="text-sm font-medium">Pilih karya yang sesuai</p>
              <Button variant="ghost" size="icon-sm" onClick={() => setCandidates(null)} aria-label="Tutup">
                <X />
              </Button>
            </div>
            <ul className="flex max-h-[360px] flex-col overflow-y-auto">
              {candidates.map((c) => (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={() => pickCandidate(c)}
                    className="hover:bg-surface flex w-full flex-col gap-1 rounded-xl px-3 py-2.5 text-left"
                  >
                    <span className="line-clamp-2 text-sm font-medium">{c.title}</span>
                    <span className="text-muted-foreground line-clamp-1 text-xs">
                      {c.authors}
                      {c.year ? ` · ${c.year}` : ""}
                      {c.container ? ` · ${c.container}` : ""}
                      {c.doi ? ` · DOI ${c.doi}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="bg-surface flex min-h-[320px] flex-col rounded-[24px] p-2 lg:min-h-[470px]">
          <label htmlFor="bulk" className="sr-only">
            Daftar DOI atau judul
          </label>
          <textarea
            id="bulk"
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            disabled={!!bulkProgress}
            placeholder={"Tempel beberapa DOI atau judul sekaligus, satu per baris...\n\n10.1038/nature14539\nAttention is all you need"}
            className="placeholder:text-muted-foreground flex-1 resize-none bg-transparent p-3 text-sm leading-relaxed outline-none md:text-base"
          />
          <div className="flex items-center justify-between gap-2 rounded-full bg-white p-1.5 pl-4">
            <button
              type="button"
              onClick={() => {
                setBulk("");
                searchRef.current?.focus();
              }}
              className="flex items-center gap-1.5 text-sm hover:text-primary"
            >
              <Plus className="size-4" />
              Tambahkan baru
            </button>
            <Button size="pill-sm" onClick={handleBulk} disabled={!!bulkProgress} className="min-w-[110px]">
              {bulkProgress ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {bulkProgress.done}/{bulkProgress.total}
                </>
              ) : (
                "Buatkan"
              )}
            </Button>
          </div>
        </section>

        <section
          aria-live="polite"
          className="bg-surface flex min-h-[320px] flex-col rounded-[24px] p-2 lg:min-h-[470px]"
        >
          <div className="flex-1 overflow-y-auto p-2 lg:max-h-[400px]">
            {!hydrated || sources.length === 0 ? (
              <p className="text-muted-foreground p-1 text-sm md:text-base">
                Daftar pustaka akan muncul di sini dalam format {STYLE_LABEL[style]}.
              </p>
            ) : (
              <ol className="flex flex-col gap-2">
                {entries.map((entry) => (
                  <li key={entry.id} className="group relative rounded-2xl bg-white p-3 pr-20 text-sm leading-relaxed md:text-[15px]">
                    <div
                      className={cn(
                        "break-words",
                        style === "apa"
                          ? "[&_.csl-entry]:pl-8 [&_.csl-entry]:-indent-8"
                          : "[&_.csl-entry]:flex [&_.csl-entry]:gap-2 [&_.csl-left-margin]:shrink-0",
                      )}
                      dangerouslySetInnerHTML={{ __html: entry.html }}
                    />
                    <p className="text-muted-foreground mt-1.5 text-xs">
                      Kutipan dalam teks: <span className="text-foreground font-medium">{entry.inText}</span>
                    </p>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <IconAction label="Salin" onClick={() => copy(entry.text, entry.id)}>
                        {copiedKey === entry.id ? <Check className="text-success" /> : <Copy />}
                      </IconAction>
                      <IconAction
                        label="Hapus"
                        onClick={() => setSources((prev) => prev.filter((s) => s.id !== entry.id))}
                      >
                        <Trash2 />
                      </IconAction>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 rounded-full bg-white p-1.5 pl-4">
            <span className="text-muted-foreground flex items-center gap-2 text-sm">
              {formatting && <Loader2 className="size-4 animate-spin" />}
              {sources.length} sumber · {STYLE_LABEL[style]}
            </span>
            <div className="flex items-center gap-1">
              {sources.length > 0 && (
                <IconAction
                  label="Hapus semua"
                  onClick={() => {
                    setSources([]);
                    toast.success("Daftar pustaka dikosongkan.");
                  }}
                >
                  <Trash2 />
                </IconAction>
              )}
              <IconAction label="Salin semua" disabled={entries.length === 0} onClick={() => copy(allText, "all")}>
                {copiedKey === "all" ? <Check className="text-success" /> : <Copy />}
              </IconAction>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function IconAction({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-pill"
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
          className={cn("text-foreground/70 hover:text-foreground")}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
