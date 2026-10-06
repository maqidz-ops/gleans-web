// Adapted from maqidz-ops/ngampus-app at 8f0021d (src/lib/pdf/compress.ts).
import "core-js/actual/promise/with-resolvers.js";
import type { ProcessContext } from "./tools";
import { PDFDocument } from "pdf-lib";
import type { PDFPageProxy } from "pdfjs-dist";

function checkpoint(context: ProcessContext) {
  if (context.signal?.aborted) throw new DOMException("Pemrosesan dibatalkan.", "AbortError");
}

type RasterAttempt = {
  longEdge: number;
  quality: number;
};

/**
 * Long-edge pixel budget, not a multiplier of the PDF page. Scans often use a
 * MediaBox already sized in pixels; a scale of 1.25 upscales that bitmap and
 * the new JPEG barely shrinks. Attempts go from sharpest to smallest. A short
 * quality search then picks the largest JPEG that still fits the target ratio.
 */
const RASTER = {
  targetRatio: 0.575,
  maxScale: 3,
  minQuality: 0.4,
  attempts: [
    { longEdge: 2400, quality: 0.86 },
    { longEdge: 2400, quality: 0.74 },
    { longEdge: 2400, quality: 0.62 },
    { longEdge: 1900, quality: 0.68 },
    { longEdge: 1600, quality: 0.56 },
    { longEdge: 1300, quality: 0.46 },
    { longEdge: 1100, quality: 0.4 },
  ],
};

// Aim for 42.5% savings, allowing outputs up to 65% of the original size.
const TARGET_SLACK = 0.65 / RASTER.targetRatio;
const MAX_FULL_PASSES = 3;
const SEARCH_STEPS = 3;

async function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Gagal encode JPEG."))),
      "image/jpeg",
      quality
    );
  });
  if (blob.type && blob.type !== "image/jpeg") {
    throw new Error("Browser ini tidak menghasilkan JPEG.");
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error("Browser ini tidak menghasilkan JPEG.");
  }
  return bytes;
}

async function rewritePdf(data: Uint8Array, fileName: string): Promise<Uint8Array> {
  const src = await PDFDocument.load(data, { updateMetadata: false });
  const out = await PDFDocument.create();
  out.setTitle(fileName.replace(/\.pdf$/i, "") + " (kompres)");
  out.setProducer("Gleans File");
  const pages = await out.copyPages(src, src.getPageIndices());
  pages.forEach((p) => out.addPage(p));
  return out.save({ useObjectStreams: true });
}

function pageBox(page: PDFPageProxy) {
  const viewport = page.getViewport({ scale: 1 });
  return {
    width: Math.max(1, viewport.width),
    height: Math.max(1, viewport.height),
  };
}

function scaleForLongEdge(width: number, height: number, longEdge: number, maxScale: number) {
  const longest = Math.max(width, height, 1);
  return Math.min(maxScale, Math.max(0.05, longEdge / longest));
}

async function renderPage(
  page: PDFPageProxy,
  width: number,
  height: number,
  longEdge: number,
  maxScale: number,
  context: ProcessContext
) {
  checkpoint(context);
  const viewport = page.getViewport({
    scale: scaleForLongEdge(width, height, longEdge, maxScale),
  });
  const canvas = window.document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia di browser ini.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const rendering = page.render({ canvasContext: ctx, viewport, canvas: null, intent: "print" });
  const cancel = () => rendering.cancel();
  context.signal?.addEventListener("abort", cancel, { once: true });
  try {
    checkpoint(context);
    await rendering.promise;
    checkpoint(context);
    return canvas;
  } catch (error) {
    releaseCanvas(canvas);
    checkpoint(context);
    throw error;
  } finally { context.signal?.removeEventListener("abort", cancel); }
}

function downscaleCanvas(source: HTMLCanvasElement, longEdge: number) {
  const longest = Math.max(source.width, source.height);
  if (longest <= longEdge + 1) return source;
  const ratio = longEdge / longest;
  const canvas = window.document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * ratio));
  canvas.height = Math.max(1, Math.round(source.height * ratio));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia di browser ini.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function releaseCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 0;
  canvas.height = 0;
}

async function loadPdfjs() {
  await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs");
  return import("pdfjs-dist/legacy/build/pdf.mjs");
}

async function encodeAttempt(
  base: HTMLCanvasElement,
  baseEdge: number,
  attempt: RasterAttempt
) {
  const canvas = attempt.longEdge >= baseEdge ? base : downscaleCanvas(base, attempt.longEdge);
  try {
    return await canvasToJpeg(canvas, attempt.quality);
  } finally {
    if (canvas !== base) releaseCanvas(canvas);
  }
}

async function searchQuality(
  base: HTMLCanvasElement,
  baseEdge: number,
  longEdge: number,
  lowQuality: number,
  highQuality: number,
  pageCount: number,
  budget: number,
  knownLowFits: boolean
) {
  let best: RasterAttempt | null = knownLowFits ? { longEdge, quality: lowQuality } : null;
  let lo = lowQuality;
  let hi = highQuality;
  for (let step = 0; step < SEARCH_STEPS; step++) {
    const quality = Math.round(((lo + hi) / 2) * 100) / 100;
    if (quality - lo < 0.02 || hi - quality < 0.02) break;
    const jpeg = await encodeAttempt(base, baseEdge, { longEdge, quality });
    if (jpeg.byteLength * pageCount <= budget) {
      best = { longEdge, quality };
      lo = quality;
    } else {
      hi = quality;
    }
  }
  return best;
}

async function chooseAttempt(
  page: PDFPageProxy,
  pageCount: number,
  originalSize: number,
  context: ProcessContext
) {
  const plan = RASTER;
  const target = Math.max(1, Math.floor(originalSize * plan.targetRatio));
  const budget = Math.floor(target * TARGET_SLACK);
  const box = pageBox(page);
  const base = await renderPage(page, box.width, box.height, plan.attempts[0].longEdge, plan.maxScale, context);
  const baseEdge = Math.max(base.width, base.height);
  let best = plan.attempts[plan.attempts.length - 1];
  let bestBytes = Number.POSITIVE_INFINITY;
  let previousOver: RasterAttempt | null = null;

  try {
    for (let i = 0; i < plan.attempts.length; i++) {
      checkpoint(context);
      const attempt = plan.attempts[i];
      const jpeg = await encodeAttempt(base, baseEdge, attempt);
      if (jpeg.byteLength < bestBytes) {
        bestBytes = jpeg.byteLength;
        best = attempt;
      }
      const estimate = jpeg.byteLength * pageCount;
      if (estimate <= budget) {
        let settings = attempt;
        if (previousOver && previousOver.quality - attempt.quality > 0.03) {
          const sameEdge = previousOver.longEdge === attempt.longEdge;
          const searched = await searchQuality(
            base,
            baseEdge,
            previousOver.longEdge,
            sameEdge ? attempt.quality : plan.minQuality,
            previousOver.quality,
            pageCount,
            budget,
            sameEdge
          );
          if (searched) settings = searched;
        }
        const fallback = plan.attempts.slice(i, i + 2);
        return { settings, fallback, hopeless: false };
      }
      previousOver = attempt;
    }
  } finally {
    releaseCanvas(base);
    page.cleanup?.();
  }

  return {
    settings: best,
    fallback: [best],
    hopeless: bestBytes * pageCount >= originalSize,
  };
}

async function rasterize(
  pdf: { numPages: number; getPage: (n: number) => Promise<PDFPageProxy> },
  attempt: RasterAttempt,
  fileName: string,
  originalSize: number,
  stopAtBudget: boolean,
  context: ProcessContext
): Promise<Uint8Array | null> {
  const plan = RASTER;
  const budget = Math.floor(originalSize * plan.targetRatio * TARGET_SLACK);
  const out = await PDFDocument.create();
  out.setTitle(fileName.replace(/\.pdf$/i, "") + " (kompres)");
  out.setProducer("Gleans File");
  let jpegSum = 0;

  for (let i = 1; i <= pdf.numPages; i++) {
    checkpoint(context);
    const page = await pdf.getPage(i);
    const box = pageBox(page);
    const canvas = await renderPage(page, box.width, box.height, attempt.longEdge, plan.maxScale, context);
    let jpeg: Uint8Array;
    try { jpeg = await canvasToJpeg(canvas, attempt.quality); }
    finally { releaseCanvas(canvas); page.cleanup?.(); }
    checkpoint(context);
    jpegSum += jpeg.byteLength;
    const limit = stopAtBudget ? budget : originalSize;
    if (jpegSum > limit) return null;

    const img = await out.embedJpg(jpeg);
    const dest = out.addPage([box.width, box.height]);
    dest.drawImage(img, { x: 0, y: 0, width: box.width, height: box.height });
    context.onProgress?.(`Mengompres halaman ${i} dari ${pdf.numPages}…`);
    await new Promise((resolve) => setTimeout(resolve, 0));
    checkpoint(context);
  }

  return out.save({ useObjectStreams: true });
}

async function rasterCompress(
  data: Uint8Array,
  fileName: string,
  context: ProcessContext
): Promise<Uint8Array | null> {
  const pdfjs = await loadPdfjs();
  const source = data.slice();
  checkpoint(context);
  const loading = pdfjs.getDocument({ data: source, useSystemFonts: true });
  const cancel = () => { void loading.destroy(); };
  context.signal?.addEventListener("abort", cancel, { once: true });
  try {
    checkpoint(context);
    const pdf = await loading.promise;
    checkpoint(context);
    if (pdf.numPages < 1) return null;
    const plan = RASTER;
    const budget = Math.floor(data.byteLength * plan.targetRatio * TARGET_SLACK);
    const first = await pdf.getPage(1);
    const choice = await chooseAttempt(first, pdf.numPages, data.byteLength, context);
    if (choice.hopeless) {
      checkpoint(context);
      return null;
    }

    const queue = [choice.settings, ...choice.fallback.filter((item) => item !== choice.settings)];
    let best: Uint8Array | null = null;
    const passes = Math.min(MAX_FULL_PASSES, queue.length);
    for (let pass = 0; pass < passes; pass++) {
      const stopAtBudget = pass < passes - 1;
      const bytes = await rasterize(
        pdf,
        queue[pass],
        fileName,
        data.byteLength,
        stopAtBudget,
        context
      );
      if (!bytes) continue;
      if (bytes.byteLength <= budget) return bytes;
      if (!best || bytes.byteLength < best.byteLength) best = bytes;
    }
    if (best && best.byteLength < data.byteLength) return best;
    return null;
  } finally {
    context.signal?.removeEventListener("abort", cancel);
    await loading.destroy();
  }
}

export async function compressAutomatically(data: Uint8Array, fileName: string, context: ProcessContext = {}) {
  checkpoint(context);
  context.onProgress?.("Menentukan kualitas kompresi…");
  const raster = await rasterCompress(data, fileName, context);
  checkpoint(context);
  if (raster && raster.byteLength < data.byteLength) return { bytes: raster, rasterized: true };

  context.onProgress?.("Mengoptimalkan struktur PDF…");
  const light = await rewritePdf(data, fileName);
  checkpoint(context);
  return { bytes: light.byteLength < data.byteLength ? light : data, rasterized: false };
}
