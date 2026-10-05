/** Run legacy Word parsing away from the UI; input never leaves the browser. */
export function extractDocText(bytes: Uint8Array, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException("Dibatalkan", "AbortError")); return; }
    const worker = new Worker("/workers/doc-parser.js");
    const timer = setTimeout(() => finish(new Error("Membaca DOC terlalu lama. Simpan ulang sebagai DOCX lalu coba lagi.")), 30_000);
    const cancel = () => finish(new DOMException("Dibatalkan", "AbortError"));
    function finish(error?: Error, text?: string) {
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
      worker.terminate();
      if (error) reject(error); else resolve(text ?? "");
    }
    signal?.addEventListener("abort", cancel, { once: true });
    worker.onmessage = (event: MessageEvent<{ text?: string; error?: string }>) => {
      finish(event.data.error ? new Error(event.data.error) : undefined, event.data.text);
    };
    worker.onerror = () => finish(new Error("Pembaca DOC gagal dimuat. Periksa koneksi lalu coba lagi."));
    const buffer = Uint8Array.from(bytes).buffer;
    worker.postMessage(buffer, [buffer]);
  });
}
