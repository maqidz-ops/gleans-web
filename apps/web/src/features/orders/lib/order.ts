// PDF.js 6 still expects this API even in its legacy build.
import "core-js/actual/promise/with-resolvers.js";
import { countWords, formatBytes, formatNumber } from "@/lib/format";

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_WORDS = 25_000;
export { SHIELD_PRICE as PRICE_PER_DOCUMENT } from "@/lib/plans";

export const ACCEPTED_FILES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
};

const EXTENSIONS = ["pdf", "doc", "docx", "txt"];

export const LIMIT_LABEL = `Maksimal file ${MAX_FILE_BYTES / 1024 / 1024}MB • ${formatNumber(MAX_WORDS)} kata`;

export { whatsappSchema, resolvePromo, type AppliedPromo } from "./pricing";

export function validateFile(file: File): string | null {
  const ext = extensionOf(file);
  if (!ext || !EXTENSIONS.includes(ext)) return "Format file belum didukung. Gunakan PDF, DOC, DOCX, atau TXT.";
  if (file.size > MAX_FILE_BYTES) return `Ukuran file maksimal ${formatBytes(MAX_FILE_BYTES)}.`;
  if (file.size === 0) return "File yang diunggah kosong.";
  return null;
}

export function validateWords(words: number): string | null {
  if (words > MAX_WORDS) return `Dokumen maksimal ${formatNumber(MAX_WORDS)} kata, dokumenmu ${formatNumber(words)} kata.`;
  return null;
}

export async function extractWordCount(file: File): Promise<number> {
  const ext = extensionOf(file);
  const text = await withTimeout(
    ext === "pdf" ? readPdf(file) : ext === "doc" || ext === "docx" ? readWord(file) : file.text(),
    60_000,
    "Membaca dokumen terlalu lama. Coba unggah ulang.",
  );
  return countWords(text);
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function extensionOf(file: File) {
  return file.name.split(".").pop()?.toLowerCase();
}

async function readPdf(file: File) {
  // Both bundles need the legacy polyfills for older mobile browsers.
  // Load the worker into this page. On Vercel the separate module worker often
  // never becomes ready, so the upload stays stuck on "Membaca dokumen...".
  await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  try {
    const pages: string[] = [];
    for (let page = 1; page <= doc.numPages; page += 1) {
      const content = await (await doc.getPage(page)).getTextContent();
      pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
    }
    return pages.join("\n");
  } finally {
    await task.destroy();
  }
}

async function readWord(file: File) {
  const { Buffer } = await import("buffer");
  if (typeof globalThis.Buffer === "undefined") {
    globalThis.Buffer = Buffer;
  }
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return value;
}
