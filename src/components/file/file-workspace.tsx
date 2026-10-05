"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Download, FileText, FileUp, Loader2, Plus, X } from "lucide-react";
import { Tabs } from "radix-ui";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CompressionMode, FileResult } from "@/lib/file/tools";

const TOOLS = [
  { id: "convert", label: "Convert", action: "Konversi ke PDF", formats: "DOCX, DOC, TXT, PNG dan JPEG" },
  { id: "merge", label: "Merge", action: "Gabungkan PDF", formats: "PDF" },
  { id: "compress", label: "Compress", action: "Kompres PDF", formats: "PDF" },
] as const;
type ToolId = (typeof TOOLS)[number]["id"];
type Downloadable = Omit<FileResult, "bytes"> & { blob: Blob };
const MAX_FILES = 10;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const PDF_ACCEPT = { "application/pdf": [".pdf"] };
const CONVERT_ACCEPT = {
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};
function fileKey(file: File) { return `${file.name}-${file.size}-${file.lastModified}`; }

export function FileWorkspace() {
  const [filesByTool, setFilesByTool] = useState<Record<ToolId, File[]>>({ convert: [], merge: [], compress: [] });
  const [resultsByTool, setResultsByTool] = useState<Record<ToolId, Downloadable[]>>({ convert: [], merge: [], compress: [] });
  const [busy, setBusy] = useState(false);
  const [compression, setCompression] = useState<CompressionMode>("lossless");

  return (
    <Tabs.Root defaultValue="merge" className="flex min-w-0 flex-col gap-6">
      <Tabs.List aria-label="Alat Gleans File" className="grid w-full max-w-[520px] grid-cols-3 self-center rounded-full border bg-white p-1.5 sm:p-2">
        {TOOLS.map((tool) => (
          <Tabs.Trigger key={tool.id} value={tool.id} disabled={busy}
            className="group flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-medium uppercase transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60 data-[state=active]:bg-primary data-[state=active]:text-white sm:min-h-12 sm:gap-3 sm:px-4 sm:text-base">
            <Image src="/images/logo-gleans-file.svg" alt="" width={24} height={24}
              className="hidden size-5 shrink-0 group-data-[state=active]:brightness-0 group-data-[state=active]:invert min-[375px]:block sm:size-6" />
            {tool.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {TOOLS.map((tool) => (
        <Tabs.Content key={tool.id} value={tool.id} className="min-w-0 rounded-[24px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          <FilePicker tool={tool} files={filesByTool[tool.id]} results={resultsByTool[tool.id]} busy={busy} onBusyChange={setBusy}
            compression={compression} onCompressionChange={(mode) => {
              setCompression(mode);
              setResultsByTool((current) => ({ ...current, compress: [] }));
            }}
            onFilesChange={(files) => {
              setFilesByTool((current) => ({ ...current, [tool.id]: files }));
              setResultsByTool((current) => ({ ...current, [tool.id]: [] }));
            }}
            onResultsChange={(results) => setResultsByTool((current) => ({ ...current, [tool.id]: results }))} />
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

function FilePicker({ tool, files, results, busy, onBusyChange, compression, onCompressionChange, onFilesChange, onResultsChange }: {
  tool: (typeof TOOLS)[number]; files: File[]; results: Downloadable[]; busy: boolean;
  onBusyChange: (busy: boolean) => void; compression: CompressionMode;
  onCompressionChange: (mode: CompressionMode) => void;
  onFilesChange: (files: File[]) => void; onResultsChange: (results: Downloadable[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  const { getRootProps, getInputProps, open, isDragActive, isDragReject } = useDropzone({
    accept: tool.id === "convert" ? CONVERT_ACCEPT : PDF_ACCEPT,
    maxSize: MAX_FILE_BYTES, multiple: true, noClick: true, noKeyboard: true, disabled: busy,
    onDrop: (accepted, rejected) => {
      const messages: string[] = [];
      const existing = new Set(files.map(fileKey));
      const added: File[] = [];
      let total = files.reduce((sum, file) => sum + file.size, 0);
      for (const file of accepted) {
        const key = fileKey(file);
        if (file.size === 0) messages.push("File kosong tidak dapat dipilih.");
        else if (existing.has(key)) messages.push("File yang sama sudah ada dalam daftar.");
        else if (files.length + added.length >= MAX_FILES) messages.push(`Pilih maksimal ${MAX_FILES} file sekaligus.`);
        else if (total + file.size > MAX_TOTAL_BYTES) messages.push("Total ukuran file maksimal 50 MB.");
        else { added.push(file); existing.add(key); total += file.size; }
      }
      for (const rejection of rejected) {
        for (const issue of rejection.errors) {
          messages.push(issue.code === "file-too-large" ? "Ukuran setiap file maksimal 25 MB." : `Format belum didukung. Pilih ${tool.formats}.`);
        }
      }
      if (added.length) { onFilesChange([...files, ...added]); setProgress(""); }
      setError(messages.length ? [...new Set(messages)].join(" ") : null);
    },
  });

  function changeFiles(next: File[]) { onFilesChange(next); setError(null); setProgress(""); }
  function moveFile(index: number, direction: -1 | 1) {
    const next = [...files];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    changeFiles(next);
  }

  async function process() {
    if (abort.current) return;
    const controller = new AbortController();
    abort.current = controller;
    onBusyChange(true);
    onResultsChange([]);
    setError(null);
    setProgress("Menyiapkan file…");
    try {
      const tools = await import("@/lib/file/tools");
      tools.validateSelection(files, tool.id);
      const outputs: Downloadable[] = [];
      const context = { signal: controller.signal, onProgress: setProgress };
      const addResult = (result: FileResult) => {
        const names = new Set(outputs.map((output) => output.name));
        const base = result.name.replace(/\.pdf$/i, "");
        let name = result.name, count = 2;
        while (names.has(name)) name = `${base}-${count++}.pdf`;
        const { bytes, ...metadata } = result;
        outputs.push({ ...metadata, name, blob: new Blob([Uint8Array.from(bytes).buffer], { type: "application/pdf" }) });
      };
      if (tool.id === "merge") addResult(await tools.mergePdfs(files, context));
      else {
        for (let index = 0; index < files.length; index += 1) {
          if (controller.signal.aborted) throw new DOMException("Dibatalkan", "AbortError");
          const file = files[index];
          const fileContext = { ...context, onProgress: (message: string) => setProgress(`${index + 1}/${files.length} · ${message}`) };
          try {
            addResult(tool.id === "convert" ? await tools.convertToPdf(file, fileContext) : await tools.compressPdf(file, compression, fileContext));
          } catch (failure) {
            if (controller.signal.aborted) throw failure;
            // Retain completed files if a later file in the batch fails.
            onResultsChange(outputs);
            throw new Error(`${file.name}: ${tools.fileError(failure)}`);
          }
        }
      }
      if (controller.signal.aborted) throw new DOMException("Dibatalkan", "AbortError");
      onResultsChange(outputs);
      setProgress(`${outputs.length} PDF siap diunduh.`);
    } catch (failure) {
      if (controller.signal.aborted) setProgress("Pemrosesan dibatalkan. File asli tetap tersedia.");
      else { setError(failure instanceof Error ? failure.message : "File gagal diproses. Coba lagi."); setProgress(""); }
    } finally { abort.current = null; onBusyChange(false); }
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div {...getRootProps({ role: "region", "aria-label": `Pilih file untuk ${tool.label}`, "aria-describedby": `file-help-${tool.id}`, "aria-busy": busy })}
        className={cn("relative flex min-h-[360px] min-w-0 flex-col rounded-[24px] border border-dashed bg-surface p-5 transition-colors sm:min-h-[480px] sm:p-8", isDragActive && "border-primary bg-accent", isDragReject && "border-destructive bg-destructive/5")}>
        <input {...getInputProps({ "aria-label": `Pilih file ${tool.label}` })} />
        {!files.length ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 py-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white"><FileUp className="size-6" strokeWidth={1.6} aria-hidden="true" /></span>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">{isDragActive ? "Lepaskan file di sini" : "Upload File"}</h2>
              <p className="text-subtle text-base">{tool.formats}</p>
            </div>
            <Button type="button" size="pill-sm" onClick={open} className="h-11 text-base font-normal"><FileText className="size-5" aria-hidden="true" />Pilih File</Button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1"><h2 className="text-lg font-semibold">File pilihanmu</h2><p className="text-muted-foreground text-sm">{files.length} dari {MAX_FILES} file dipilih</p></div>
              <Button type="button" variant="outline" size="pill-sm" onClick={open} disabled={busy || files.length >= MAX_FILES} className="min-h-11 font-normal"><Plus className="size-4" aria-hidden="true" />Tambah File</Button>
            </div>
            <ul className="flex min-w-0 flex-col gap-3" aria-label={`Daftar file ${tool.label}`}>
              {files.map((file, index) => (
                <li key={fileKey(file)} className="flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border bg-white p-3 sm:p-4">
                  <span className="bg-accent text-primary flex size-11 shrink-0 items-center justify-center rounded-xl"><FileText className="size-5" aria-hidden="true" /></span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1"><p className="truncate text-sm font-medium sm:text-base" title={file.name}>{file.name}</p><p className="text-muted-foreground text-xs sm:text-sm">{file.name.split(".").pop()?.toUpperCase()} · {formatBytes(file.size)}</p></div>
                  <Button type="button" variant="ghost" size="icon-lg" disabled={busy} className="size-11 rounded-full" aria-label={`Hapus ${file.name}`} onClick={() => changeFiles(files.filter((item) => fileKey(item) !== fileKey(file)))}><X className="size-5" aria-hidden="true" /></Button>
                  {tool.id === "merge" && (
                    <div className="flex w-full items-center justify-end gap-1 border-t pt-2">
                      <span className="text-muted-foreground mr-auto text-xs">Urutan {index + 1}</span>
                      <Button type="button" variant="ghost" size="icon-lg" className="size-11" disabled={busy || index === 0} aria-label={`Naikkan ${file.name}`} onClick={() => moveFile(index, -1)}><ArrowUp className="size-4" aria-hidden="true" /></Button>
                      <Button type="button" variant="ghost" size="icon-lg" className="size-11" disabled={busy || index === files.length - 1} aria-label={`Turunkan ${file.name}`} onClick={() => moveFile(index, 1)}><ArrowDown className="size-4" aria-hidden="true" /></Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {tool.id === "compress" && (
              <fieldset disabled={busy} className="flex flex-col gap-3">
                <legend className="mb-2 text-sm font-medium">Mode kompresi</legend>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3"><input type="radio" name="compression" checked={compression === "lossless"} onChange={() => { onCompressionChange("lossless"); setProgress(""); setError(null); }} className="mt-1 accent-primary" /><span className="text-sm"><span className="block font-medium">Pertahankan teks</span><span className="text-muted-foreground">Optimasi struktur PDF tanpa mengubah tampilan halaman.</span></span></label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3"><input type="radio" name="compression" checked={compression === "small"} onChange={() => { onCompressionChange("small"); setProgress(""); setError(null); }} className="mt-1 accent-primary" /><span className="text-sm"><span className="block font-medium">Ukuran lebih kecil</span><span className="text-muted-foreground">Halaman menjadi gambar. Teks tidak bisa dipilih; formulir dan tautan tidak interaktif. Maksimal 100 halaman.</span></span></label>
              </fieldset>
            )}
            <div className="mt-auto flex flex-col items-center justify-between gap-3 border-t pt-5 sm:flex-row">
              <p className="text-muted-foreground text-center text-sm sm:text-left">{tool.id === "merge" ? "Pilih minimal 2 PDF. Hasil mengikuti urutan di atas." : tool.id === "convert" ? "Setiap file menghasilkan satu PDF." : "Ukuran hasil bergantung pada isi PDF."}</p>
              <Button type="button" size="pill-sm" disabled={busy || (tool.id === "merge" && files.length < 2)} onClick={process} className="h-11 w-full font-normal sm:w-auto">{busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}{busy ? "Memproses…" : tool.action}</Button>
            </div>
          </div>
        )}
      </div>
      {tool.id === "convert" && <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">DOC/DOCX dikonversi dari teks utama; tata letak, tabel, gambar, header, dan footer Word tidak dipertahankan. TXT menggunakan UTF-8.</p>}
      {progress && <div className="flex flex-wrap items-center justify-between gap-2"><p role="status" className="text-primary text-sm">{progress}</p>{busy && <Button type="button" variant="outline" size="pill-sm" onClick={() => abort.current?.abort()}>Batalkan</Button>}</div>}
      {error && <p role="alert" className="text-destructive text-sm break-words">{error}</p>}
      {results.length > 0 && <section aria-label="Hasil pemrosesan" className="flex min-w-0 flex-col gap-3 rounded-2xl border p-4 sm:p-5"><h2 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="text-success size-5" aria-hidden="true" />Hasil siap diunduh</h2>{results.map((result, index) => <DownloadResult key={`${index}-${result.name}`} result={result} compression={tool.id === "compress"} />)}</section>}
      <p id={`file-help-${tool.id}`} className="text-muted-foreground text-center text-xs leading-relaxed sm:text-sm">Maksimal 10 file, masing-masing 25 MB; total 50 MB. File diproses di perangkatmu dan tidak dikirim ke server.</p>
    </div>
  );
}

function DownloadResult({ result, compression }: { result: Downloadable; compression: boolean }) {
  const [url, setUrl] = useState("");
  useEffect(() => { const next = URL.createObjectURL(result.blob); setUrl(next); return () => URL.revokeObjectURL(next); }, [result.blob]);
  const reduction = Math.max(0, Math.round((1 - result.blob.size / result.sourceBytes) * 100));
  return (
    <div className="flex min-w-0 flex-col gap-3 border-t pt-4 first-of-type:border-t-0 first-of-type:pt-0">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium" title={result.name}>{result.name}</p><p className="text-muted-foreground mt-1 text-xs">{result.pages} halaman · {formatBytes(result.blob.size)}{compression && ` · ${reduction > 0 ? `lebih kecil ${reduction}%` : "ukuran tetap"}`}</p></div>
        <Button asChild size="pill-sm" className="h-11 font-normal"><a href={url || undefined} download={result.name} aria-label={`Unduh ${result.name}`}><Download className="size-4" aria-hidden="true" />Unduh PDF</a></Button>
      </div>
      {result.notice && <p className="text-muted-foreground text-xs leading-relaxed">{result.notice}</p>}
    </div>
  );
}
