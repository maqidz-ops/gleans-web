import "server-only";
export const PRIVATE_HEADERS = { "Cache-Control": "private, no-store", Vary: "Cookie" };
export function json(body: unknown, status = 200) { return Response.json(body, { status, headers: PRIVATE_HEADERS }); }
export function sameOrigin(request: Request) {
  try {
    const origin = new URL(request.headers.get("origin") ?? "");
    return ["http:", "https:"].includes(origin.protocol) && origin.host === request.headers.get("host");
  } catch { return false; }
}
export function paymentError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "QRIS_UNAVAILABLE") return json({ error: "QRIS belum tersedia untuk proyek ini. Silakan hubungi support." }, 503);
  if (code === "PUBLIC_CALLBACK_REQUIRED") return json({ error: "Alamat publik pembayaran belum dikonfigurasi. Silakan hubungi support." }, 503);
  return json({ error: "Pembayaran belum dapat diproses. Silakan coba kembali beberapa saat lagi." }, 503);
}
