"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Download, FileText, FileUp, Loader2, Plus, X } from "lucide-react";
import { Tabs } from "radix-ui";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FileResult } from "@/lib/file/tools";

const TOOLS = [
  { id: "convert", label: "Convert", action: "Konversi", formats: "DOCX, DOC, TXT, PNG dan JPEG" },
  { id: "merge", label: "Merge", action: "Gabungkan", formats: "PDF" },
  { id: "compress", label: "Compress", action: "Kompres", formats: "PDF" },
] as const;
type ToolId = (typeof TOOLS)[number]["id"];
type Downloadable = Omit<FileResult, "bytes"> & { blob: Blob };
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
function isImage(file: File) { return /\.(png|jpe?g)$/i.test(file.name); }
function fileKey(file: File) { return `${file.name}-${file.size}-${file.lastModified}`; }

export function FileWorkspace() {
  const [filesByTool, setFilesByTool] = useState<Record<ToolId, File[]>>({ convert: [], merge: [], compress: [] });
  const [resultsByTool, setResultsByTool] = useState<Record<ToolId, Downloadable[]>>({ convert: [], merge: [], compress: [] });
  const [busy, setBusy] = useState(false);

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
        <Tabs.Content key={tool.id} value={tool.id} className="min-w-0 rounded-[12px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          <FilePicker tool={tool} files={filesByTool[tool.id]} results={resultsByTool[tool.id]} busy={busy} onBusyChange={setBusy}
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

function FilePicker({ tool, files, results, busy, onBusyChange, onFilesChange, onResultsChange }: {
  tool: (typeof TOOLS)[number]; files: File[]; results: Downloadable[]; busy: boolean;
  onBusyChange: (busy: boolean) => void;
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
        const images = tool.id === "convert" ? files.filter(isImage) : [];
        let imagesProcessed = false;
        for (let index = 0; index < files.length; index += 1) {
          if (controller.signal.aborted) throw new DOMException("Dibatalkan", "AbortError");
          const file = files[index];
          const fileContext = { ...context, onProgress: (message: string) => setProgress(`${index + 1}/${files.length} · ${message}`) };
          try {
            if (tool.id === "convert" && isImage(file)) {
              if (imagesProcessed) continue;
              addResult(await tools.imagesToPdf(images, fileContext));
              imagesProcessed = true;
            } else {
              addResult(tool.id === "convert" ? await tools.convertToPdf(file, fileContext) : await tools.compressPdf(file, fileContext));
            }
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

  const inputBytes = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <section {...getRootProps({ role: "region", "aria-label": `Pilih file untuk ${tool.label}`, "aria-describedby": `file-help-${tool.id}`, "aria-busy": busy, tabIndex: busy ? -1 : 0,
            onClick: (event) => {
              if (!busy && !(event.target as HTMLElement).closest("button, a, input")) open();
            },
            onKeyDown: (event) => {
              if (!busy && event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault(); open();
              }
            },
          })}
          className={cn("flex h-[420px] min-w-0 flex-col rounded-[24px] bg-surface p-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:h-[450px]", isDragActive && "bg-accent ring-2 ring-primary", isDragReject && "ring-2 ring-destructive")}>
          <input {...getInputProps({ "aria-label": `Pilih file ${tool.label}` })} />
          {!files.length ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
              <span className="flex size-14 items-center justify-center rounded-[12px] bg-white"><FileUp className="size-6" strokeWidth={1.6} aria-hidden="true" /></span>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">{isDragActive ? "Lepaskan file di sini" : "Upload File"}</h2>
                <p className="text-subtle text-sm sm:text-base">{tool.formats}</p>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3 px-1 pt-2 pb-4">
              <div className="flex items-center justify-between gap-2"><h2 className="px-1 text-base font-semibold">File pilihanmu</h2><Button type="button" variant="ghost" size="icon-lg" onClick={open} disabled={busy} className="size-11 rounded-[12px]" aria-label="Tambah file" title="Tambah file"><Plus className="size-5" aria-hidden="true" /></Button></div>
              <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1" aria-label={`Daftar file ${tool.label}`}>
                {files.map((file, index) => (
                  <li key={fileKey(file)} className="flex min-w-0 flex-wrap items-center gap-2 rounded-[16px] bg-white p-3">
                    <span className="bg-accent text-primary flex size-10 shrink-0 items-center justify-center rounded-[12px]"><FileText className="size-5" aria-hidden="true" /></span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium" title={file.name}>{file.name}</p><p className="text-muted-foreground mt-1 text-xs">{file.name.split(".").pop()?.toUpperCase()} · {formatBytes(file.size)}</p></div>
                    <Button type="button" variant="ghost" size="icon-lg" disabled={busy} className="size-11 rounded-[12px]" aria-label={`Hapus ${file.name}`} onClick={() => changeFiles(files.filter((item) => fileKey(item) !== fileKey(file)))}><X className="size-4" aria-hidden="true" /></Button>
                    {(tool.id === "merge" || (tool.id === "convert" && isImage(file))) && (
                      <div className="flex w-full items-center justify-end gap-1 border-t pt-1">
                        <span className="text-muted-foreground mr-auto text-xs">Urutan {index + 1}</span>
                        <Button type="button" variant="ghost" size="icon-lg" className="size-11 rounded-[12px]" disabled={busy || index === 0} aria-label={`Naikkan ${file.name}`} onClick={() => moveFile(index, -1)}><ArrowUp className="size-4" aria-hidden="true" /></Button>
                        <Button type="button" variant="ghost" size="icon-lg" className="size-11 rounded-[12px]" disabled={busy || index === files.length - 1} aria-label={`Turunkan ${file.name}`} onClick={() => moveFile(index, 1)}><ArrowDown className="size-4" aria-hidden="true" /></Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>

            </div>
          )}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-full bg-white p-2.5 pl-4">
            <FileSummary count={files.length} bytes={inputBytes} />
            <Button type="button" size="pill-sm" onClick={files.length ? process : open} disabled={busy || (tool.id === "merge" && files.length === 1)} className="h-11 shrink-0 rounded-full font-normal" title={tool.id === "merge" && files.length === 1 ? "Tambahkan minimal 2 PDF untuk digabungkan" : undefined}>
              {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <FileText className="size-5" aria-hidden="true" />}
              {busy ? "Memproses…" : files.length ? tool.action : "Pilih File"}
            </Button>
          </div>
        </section>
        <ResultsPanel results={results} busy={busy} progress={progress} compression={tool.id === "compress"} onCancel={() => abort.current?.abort()} />
      </div>
      {error && <p role="alert" className="text-destructive text-sm break-words">{error}</p>}
      <p id={`file-help-${tool.id}`} className="text-muted-foreground text-center text-xs leading-relaxed">Maksimal 25 MB per file; total 50 MB. File diproses di perangkatmu dan tidak dikirim ke server.</p>
    </div>
  );
}

function FileSummary({ count, bytes }: { count: number; bytes: number }) {
  return <div className="flex min-w-0 items-center gap-2 text-sm"><FileText className="size-5 shrink-0" strokeWidth={1.5} aria-hidden="true" /><span className="whitespace-nowrap">{count} Dokumen</span><span className="text-subtle hidden min-[375px]:inline" aria-hidden="true">•</span><span className="text-subtle hidden text-xs min-[375px]:inline">{formatBytes(bytes)}</span></div>;
}

function ResultsPanel({ results, busy, progress, compression, onCancel }: {
  results: Downloadable[]; busy: boolean; progress: string; compression: boolean; onCancel: () => void;
}) {
  const [packing, setPacking] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  useEffect(() => setDownloadError(""), [results]);

  async function downloadResults() {
    if (!results.length || packing) return;
    setPacking(true);
    setDownloadError("");
    try {
      let blob = results[0].blob;
      let name = results[0].name;
      if (results.length > 1) {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        for (const result of results) zip.file(result.name, await result.blob.arrayBuffer());
        blob = await zip.generateAsync({ type: "blob" });
        name = "gleans-file.zip";
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = name;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { setDownloadError("Unduhan gagal disiapkan. Coba lagi atau unduh file satu per satu."); }
    finally { setPacking(false); }
  }

  return (
    <section aria-label="Hasil pemrosesan" aria-busy={busy} className="flex h-[420px] min-w-0 flex-col rounded-[24px] bg-surface p-4 md:h-[450px]">
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-1 pt-2 pb-4">
        {busy ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center"><Loader2 className="text-primary size-8 animate-spin" aria-hidden="true" /><p role="status" className="text-sm">{progress}</p><Button type="button" variant="outline" size="pill-sm" className="rounded-[12px]" onClick={onCancel}>Batalkan</Button></div>
        ) : results.length > 0 ? (
          <><h2 className="flex items-center gap-2 text-base font-semibold"><CheckCircle2 className="text-success size-5" aria-hidden="true" />Hasil siap diunduh</h2><div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1">{results.map((result, index) => <DownloadResult key={`${index}-${result.name}`} result={result} compression={compression} />)}</div></>
        ) : <div className="flex flex-1 items-center justify-center">{progress && <p role="status" className="text-muted-foreground text-center text-sm">{progress}</p>}</div>}
        {downloadError && <p role="alert" className="text-destructive text-xs">{downloadError}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-full bg-white p-2.5 pl-4">
        <FileSummary count={results.length} bytes={results.reduce((sum, result) => sum + result.blob.size, 0)} />
        <Button type="button" size="pill-sm" disabled={!results.length || busy || packing} onClick={downloadResults} className="h-11 shrink-0 rounded-full font-normal" title={results.length > 1 ? "Unduh semua hasil sebagai ZIP" : "Unduh PDF"}>{packing ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Download className="size-5" aria-hidden="true" />}{packing ? "Menyiapkan…" : "Download"}</Button>
      </div>
    </section>
  );
}

function DownloadResult({ result, compression }: { result: Downloadable; compression: boolean }) {
  const [url, setUrl] = useState("");
  useEffect(() => { const next = URL.createObjectURL(result.blob); setUrl(next); return () => URL.revokeObjectURL(next); }, [result.blob]);
  const reduction = Math.max(0, Math.round((1 - result.blob.size / result.sourceBytes) * 100));
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-[16px] bg-white p-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium" title={result.name}>{result.name}</p><p className="text-muted-foreground mt-1 text-xs">{result.pages} halaman · {formatBytes(result.blob.size)}{compression && ` · ${reduction > 0 ? `lebih kecil ${reduction}%` : "ukuran tetap"}`}</p></div>
        <Button asChild variant="ghost" size="icon-lg" className="text-primary size-11 shrink-0 rounded-[12px] bg-transparent p-0 hover:bg-transparent hover:text-primary/70"><a href={url || undefined} download={result.name} aria-label={`Unduh ${result.name}`}><Download className="size-4" aria-hidden="true" /><span className="sr-only">Unduh PDF</span></a></Button>
      </div>
      {!compression && result.notice && <p className="text-muted-foreground text-xs leading-relaxed">{result.notice}</p>}
    </div>
  );
}
