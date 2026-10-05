"use client";

import Image from "next/image";
import { useState } from "react";
import { FileText, FileUp, Plus, X } from "lucide-react";
import { Tabs } from "radix-ui";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

const TOOLS = [
  { id: "convert", label: "Convert", action: "Konversi File" },
  { id: "merge", label: "Merge", action: "Gabungkan File" },
  { id: "compress", label: "Compress", action: "Kompres File" },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

const MAX_FILES = 10;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ACCEPTED_FILES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
};

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function FileWorkspace() {
  const [filesByTool, setFilesByTool] = useState<Record<ToolId, File[]>>({
    convert: [],
    merge: [],
    compress: [],
  });

  return (
    <Tabs.Root defaultValue="merge" className="flex min-w-0 flex-col gap-6">
      <Tabs.List
        aria-label="Alat Gleans File"
        className="grid w-full max-w-[520px] grid-cols-3 self-center rounded-full border bg-white p-1.5 sm:p-2"
      >
        {TOOLS.map((tool) => (
          <Tabs.Trigger
            key={tool.id}
            value={tool.id}
            className="group flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-medium uppercase transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary data-[state=active]:bg-primary data-[state=active]:text-white sm:min-h-12 sm:gap-3 sm:px-4 sm:text-base"
          >
            <Image
              src="/images/logo-gleans-file.svg"
              alt=""
              width={24}
              height={24}
              className="hidden size-5 shrink-0 group-data-[state=active]:brightness-0 group-data-[state=active]:invert min-[375px]:block sm:size-6"
            />
            {tool.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {TOOLS.map((tool) => (
        <Tabs.Content
          key={tool.id}
          value={tool.id}
          className="min-w-0 rounded-[24px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <FilePicker
            tool={tool}
            files={filesByTool[tool.id]}
            onFilesChange={(files) =>
              setFilesByTool((current) => ({ ...current, [tool.id]: files }))
            }
          />
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

function FilePicker({
  tool,
  files,
  onFilesChange,
}: {
  tool: (typeof TOOLS)[number];
  files: File[];
  onFilesChange: (files: File[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const { getRootProps, getInputProps, open, isDragActive, isDragReject } = useDropzone({
    accept: ACCEPTED_FILES,
    maxSize: MAX_FILE_BYTES,
    multiple: true,
    noClick: true,
    noKeyboard: true,
    onDrop: (accepted, rejected) => {
      const messages: string[] = [];
      const existing = new Set(files.map(fileKey));
      const added: File[] = [];

      for (const file of accepted) {
        const key = fileKey(file);
        if (file.size === 0) {
          messages.push("File kosong tidak dapat dipilih.");
        } else if (existing.has(key)) {
          messages.push("File yang sama sudah ada dalam daftar.");
        } else if (files.length + added.length >= MAX_FILES) {
          messages.push(`Pilih maksimal ${MAX_FILES} file sekaligus.`);
        } else {
          added.push(file);
          existing.add(key);
        }
      }

      for (const rejection of rejected) {
        for (const issue of rejection.errors) {
          messages.push(
            issue.code === "file-too-large"
              ? "Ukuran setiap file maksimal 25 MB."
              : "Format belum didukung. Pilih PDF, DOCX, DOC, atau TXT.",
          );
        }
      }

      if (added.length) onFilesChange([...files, ...added]);
      setError(messages.length ? [...new Set(messages)].join(" ") : null);
    },
  });

  function removeFile(file: File) {
    onFilesChange(files.filter((item) => fileKey(item) !== fileKey(file)));
    setError(null);
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div
        {...getRootProps({
          role: "region",
          "aria-label": `Pilih file untuk ${tool.label}`,
          "aria-describedby": `file-help-${tool.id}`,
        })}
        className={cn(
          "relative flex min-h-[360px] min-w-0 flex-col rounded-[24px] border border-dashed bg-surface p-5 transition-colors sm:min-h-[480px] sm:p-8",
          isDragActive && "border-primary bg-accent",
          isDragReject && "border-destructive bg-destructive/5",
        )}
      >
        <input {...getInputProps({ "aria-label": `Pilih file ${tool.label}` })} />

        {files.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 py-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white">
              <FileUp className="size-6" strokeWidth={1.6} aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">
                {isDragActive ? "Lepaskan file di sini" : "Upload File"}
              </h2>
              <p className="text-subtle text-base">PDF, DOCX, DOC dan TXT</p>
            </div>
            <Button type="button" size="pill-sm" onClick={open} className="h-11 text-base font-normal">
              <FileText className="size-5" aria-hidden="true" />
              Pilih File
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">File pilihanmu</h2>
                <p className="text-muted-foreground text-sm" role="status">
                  {files.length} dari {MAX_FILES} file dipilih
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="pill-sm"
                onClick={open}
                disabled={files.length >= MAX_FILES}
                className="min-h-11 font-normal"
              >
                <Plus className="size-4" aria-hidden="true" />
                Tambah File
              </Button>
            </div>

            <ul className="flex min-w-0 flex-col gap-3" aria-label={`Daftar file ${tool.label}`}>
              {files.map((file) => (
                <li key={fileKey(file)} className="flex min-w-0 items-center gap-3 rounded-2xl border bg-white p-3 sm:p-4">
                  <span className="bg-accent text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                    <FileText className="size-5" aria-hidden="true" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="truncate text-sm font-medium sm:text-base" title={file.name}>{file.name}</p>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      {file.name.split(".").pop()?.toUpperCase()} · {formatBytes(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="size-11 rounded-full"
                    aria-label={`Hapus ${file.name}`}
                    onClick={() => removeFile(file)}
                  >
                    <X className="size-5" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>

            <div className="mt-auto flex flex-col items-center justify-between gap-3 border-t pt-5 sm:flex-row">
              <p className="text-muted-foreground text-center text-sm sm:text-left">
                Fitur {tool.label.toLowerCase()} segera hadir.
              </p>
              <Button type="button" size="pill-sm" disabled className="h-11 w-full font-normal sm:w-auto">
                {tool.action}
              </Button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">{error}</p>
      )}
      <p id={`file-help-${tool.id}`} className="text-muted-foreground text-center text-xs leading-relaxed sm:text-sm">
        Maksimal 10 file, masing-masing 25 MB. File hanya dipilih di perangkatmu dan belum dikirim.
      </p>
    </div>
  );
}
