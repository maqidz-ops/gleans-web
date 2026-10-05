import "core-js/actual/promise/with-resolvers.js";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { PDFFont } from "pdf-lib";

export type CompressionMode = "lossless" | "small";
export type FileResult = {
  name: string;
  bytes: Uint8Array;
  sourceBytes: number;
  pages: number;
  notice?: string;
};
export type ProcessContext = {
  signal?: AbortSignal;
  onProgress?: (message: string) => void;
  fontBytes?: Uint8Array;
};

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
export const MAX_FILES = 10;
export const CONVERT_EXTENSIONS = ["docx", "doc", "txt", "png", "jpg", "jpeg"];

export function extension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function validateSelection(files: File[], tool: "convert" | "merge" | "compress") {
  if (!files.length) throw new Error("Pilih file terlebih dahulu.");
  if (files.length > MAX_FILES) throw new Error(`Pilih maksimal ${MAX_FILES} file.`);
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES) throw new Error("Total ukuran file maksimal 50 MB.");
  for (const file of files) {
    if (!file.size) throw new Error(`${file.name}: file kosong.`);
    if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name}: ukuran maksimal 25 MB.`);
    if (!(tool === "convert" ? CONVERT_EXTENSIONS : ["pdf"]).includes(extension(file.name))) {
      throw new Error(tool === "convert" ? "Pilih DOCX, DOC, TXT, PNG, atau JPEG." : "Merge dan Compress hanya menerima PDF.");
    }
  }
  if (tool === "merge" && files.length < 2) throw new Error("Pilih minimal dua PDF untuk digabungkan.");
}

function checkpoint(context: ProcessContext) {
  if (context.signal?.aborted) throw new DOMException("Pemrosesan dibatalkan.", "AbortError");
}
async function yieldToBrowser(context: ProcessContext) {
  await new Promise((resolve) => setTimeout(resolve, 0));
  checkpoint(context);
}
function outputName(name: string, suffix = "") {
  return `${name.replace(/\.[^.]+$/, "")}${suffix}.pdf`;
}
async function loadPdf(bytes: Uint8Array) {
  const { PDFDocument } = await import("pdf-lib");
  return PDFDocument.load(bytes, { updateMetadata: false });
}

export function fileError(error: unknown) {
  if (error instanceof Error && error.name === "EncryptedPDFError") return "PDF dilindungi kata sandi. Buka proteksinya terlebih dahulu.";
  if (error instanceof Error && error.name === "PasswordException") return "PDF dilindungi kata sandi. Buka proteksinya terlebih dahulu.";
  return error instanceof Error ? error.message : "File gagal diproses. Coba simpan ulang dokumen lalu unggah kembali.";
}

export async function mergePdfs(files: File[], context: ProcessContext = {}): Promise<FileResult> {
  validateSelection(files, "merge");
  const { PDFDocument } = await import("pdf-lib");
  const output = await PDFDocument.create();
  for (let index = 0; index < files.length; index += 1) {
    checkpoint(context);
    const file = files[index];
    context.onProgress?.(`Menggabungkan file ${index + 1} dari ${files.length}…`);
    try {
      const source = await loadPdf(new Uint8Array(await file.arrayBuffer()));
      if (!source.getPageCount()) throw new Error("PDF tidak memiliki halaman.");
      const pages = await output.copyPages(source, source.getPageIndices());
      pages.forEach((page) => output.addPage(page));
    } catch (error) {
      throw new Error(`${file.name}: ${fileError(error)}`);
    }
    await yieldToBrowser(context);
  }
  context.onProgress?.("Menyiapkan PDF gabungan…");
  const bytes = await output.save({ useObjectStreams: true });
  checkpoint(context);
  return { name: "gleans-gabungan.pdf", bytes, pages: output.getPageCount(), sourceBytes: files.reduce((sum, file) => sum + file.size, 0) };
}

let fontPromise: Promise<Uint8Array> | undefined;
async function getFont(context: ProcessContext) {
  if (context.fontBytes) return context.fontBytes;
  fontPromise ??= fetch("/fonts/NotoSans-Regular.ttf")
    .then(async (response) => {
      if (!response.ok) throw new Error("Font PDF gagal dimuat. Periksa koneksi lalu coba lagi.");
      return new Uint8Array(await response.arrayBuffer());
    })
    .catch((error) => { fontPromise = undefined; throw error; });
  return fontPromise;
}

function wrapLine(line: string, font: PDFFont, size: number, width: number) {
  if (!line) return [""];
  const lines: string[] = [];
  let current = "";
  for (const word of line.trim().split(/\s+/u)) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) { current = candidate; continue; }
    if (current) { lines.push(current); current = ""; }
    // Split overlong tokens at code-point boundaries, never at a surrogate half.
    for (const character of word) {
      if (current && font.widthOfTextAtSize(current + character, size) > width) {
        lines.push(current);
        current = "";
      }
      current += character;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function textToPdf(text: string, file: File, context: ProcessContext): Promise<FileResult> {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").replace(/\t/g, "    ").replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "");
  if (!normalized.trim()) throw new Error("Dokumen tidak memiliki teks yang dapat dikonversi.");
  if (normalized.length > 2_000_000) throw new Error("Teks terlalu panjang. Bagi dokumen menjadi beberapa file.");
  const [{ PDFDocument }, { default: fontkit }, fontBytes] = await Promise.all([
    import("pdf-lib"), import("@pdf-lib/fontkit"), getFont(context),
  ]);
  checkpoint(context);
  const output = await PDFDocument.create();
  output.registerFontkit(fontkit);
  const font = await output.embedFont(fontBytes, { subset: true });
  const supported = new Set(font.getCharacterSet());
  for (const character of normalized) {
    if (character !== "\n" && !supported.has(character.codePointAt(0)!)) {
      throw new Error(`Karakter “${character}” belum didukung font PDF. Hapus atau ganti karakter tersebut lalu coba lagi.`);
    }
  }
  const width = 595.28, height = 841.89, margin = 48, size = 11, leading = 16;
  let page = output.addPage([width, height]);
  let y = height - margin - size;
  const paragraphs = normalized.split("\n");
  for (let i = 0; i < paragraphs.length; i += 1) {
    for (const line of wrapLine(paragraphs[i], font, size, width - 2 * margin)) {
      if (y < margin) { page = output.addPage([width, height]); y = height - margin - size; }
      if (line) page.drawText(line, { x: margin, y, size, font });
      y -= leading;
    }
    if (i % 50 === 0) await yieldToBrowser(context);
  }
  const bytes = await output.save();
  checkpoint(context);
  return {
    name: outputName(file.name), bytes, pages: output.getPageCount(), sourceBytes: file.size,
    notice: ["doc", "docx"].includes(extension(file.name)) ? "PDF berisi teks utama dokumen. Tata letak, gambar, tabel, header, dan footer Word tidak dipertahankan." : undefined,
  };
}

export async function convertToPdf(file: File, context: ProcessContext = {}): Promise<FileResult> {
  validateSelection([file], "convert");
  checkpoint(context);
  const ext = extension(file.name);
  context.onProgress?.(`Membaca ${file.name}…`);
  if (ext === "txt") return textToPdf(await file.text(), file, context);
  const bytes = new Uint8Array(await file.arrayBuffer());
  checkpoint(context);
  if (ext === "doc") {
    const { extractDocText } = await import("./doc");
    return textToPdf(await extractDocText(bytes, context.signal), file, context);
  }
  if (ext === "docx") {
    const { default: mammoth } = await import("mammoth/mammoth.browser.js");
    const { value } = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
    return textToPdf(value, file, context);
  }
  const { PDFDocument } = await import("pdf-lib");
  const output = await PDFDocument.create();
  // Check PNG dimensions before decompression to bound memory usage.
  if (ext === "png") {
    const view = new DataView(bytes.buffer);
    if (bytes.length < 24 || view.getUint32(0) !== 0x89504e47 || view.getUint32(4) !== 0x0d0a1a0a) throw new Error("File bukan gambar PNG yang valid.");
    if (view.getUint32(16) * view.getUint32(20) > 25_000_000) throw new Error("Resolusi gambar maksimal 25 megapiksel. Perkecil gambar terlebih dahulu.");
  }
  const image = ext === "png" ? await output.embedPng(bytes) : await output.embedJpg(bytes);
  if (image.width * image.height > 25_000_000) throw new Error("Resolusi gambar maksimal 25 megapiksel. Perkecil gambar terlebih dahulu.");
  const landscape = image.width > image.height;
  const width = landscape ? 841.89 : 595.28, height = landscape ? 595.28 : 841.89;
  const scale = Math.min((width - 64) / image.width, (height - 64) / image.height);
  const page = output.addPage([width, height]);
  page.drawImage(image, { x: (width - image.width * scale) / 2, y: (height - image.height * scale) / 2, width: image.width * scale, height: image.height * scale });
  const data = await output.save();
  checkpoint(context);
  return { name: outputName(file.name), bytes: data, pages: 1, sourceBytes: file.size };
}

async function openRenderedPdf(bytes: Uint8Array, context: ProcessContext) {
  await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjs.getDocument({ data: bytes, useSystemFonts: true });
  task.onPassword = () => { void task.destroy(); };
  const cancel = () => { void task.destroy(); };
  context.signal?.addEventListener("abort", cancel, { once: true });
  try {
    checkpoint(context);
    const document = await task.promise;
    return { document, destroy: async () => { context.signal?.removeEventListener("abort", cancel); await task.destroy(); } };
  } catch (error) {
    context.signal?.removeEventListener("abort", cancel);
    await task.destroy();
    checkpoint(context);
    throw error;
  }
}

async function rasterizePdf(document: PDFDocumentProxy, context: ProcessContext) {
  if (document.numPages > 100) throw new Error("Mode ukuran kecil maksimal 100 halaman. Gunakan mode Pertahankan teks atau bagi PDF.");
  const { PDFDocument } = await import("pdf-lib");
  const output = await PDFDocument.create();
  for (let number = 1; number <= document.numPages; number += 1) {
    checkpoint(context);
    context.onProgress?.(`Mengompres halaman ${number} dari ${document.numPages}…`);
    const page = await document.getPage(number);
    const original = page.getViewport({ scale: 1 });
    const scale = Math.min(1.5, 1600 / Math.max(original.width, original.height));
    const viewport = page.getViewport({ scale });
    const canvas = window.document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil(viewport.width));
    canvas.height = Math.max(1, Math.ceil(viewport.height));
    try {
      await page.render({ canvas, viewport, background: "rgb(255,255,255)" }).promise;
      const jpeg = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("Halaman PDF gagal dikompres.")), "image/jpeg", 0.65,
      ));
      checkpoint(context);
      const image = await output.embedJpg(await jpeg.arrayBuffer());
      const target = output.addPage([original.width, original.height]);
      target.drawImage(image, { x: 0, y: 0, width: original.width, height: original.height });
    } finally {
      canvas.width = canvas.height = 0;
      page.cleanup();
    }
    await yieldToBrowser(context);
  }
  return output.save({ useObjectStreams: true });
}

export async function compressPdf(file: File, mode: CompressionMode, context: ProcessContext = {}): Promise<FileResult> {
  validateSelection([file], "compress");
  checkpoint(context);
  context.onProgress?.(`Mengoptimalkan ${file.name}…`);
  const original = new Uint8Array(await file.arrayBuffer());
  const document = await loadPdf(original);
  if (!document.getPageCount()) throw new Error("PDF tidak memiliki halaman.");
  let bytes: Uint8Array;
  if (mode === "small") {
    // Keep the original byte array: PDF.js takes ownership of its input.
    const rendered = await openRenderedPdf(original.slice(), context);
    try { bytes = await rasterizePdf(rendered.document, context); }
    finally { await rendered.destroy(); }
  } else {
    bytes = await document.save({ useObjectStreams: true, addDefaultPage: false });
  }
  checkpoint(context);
  const smaller = bytes.length < original.length;
  return {
    name: outputName(file.name, "-kompres"), bytes: smaller ? bytes : original,
    pages: document.getPageCount(), sourceBytes: file.size,
    notice: !smaller ? "PDF sudah efisien untuk mode ini. File asli dikembalikan agar ukuran tidak bertambah."
      : mode === "small" ? "Halaman menjadi gambar. Teks tidak dapat dipilih; formulir dan tautan interaktif tidak dipertahankan." : undefined,
  };
}
