declare module "pdfjs-dist/legacy/build/pdf.worker.min.mjs";

declare module "mammoth" {
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
}
