import { currentAdmin } from "@/features/auth/session";
import { findOrder, paymentAdmin } from "@/features/payments/server/repository";
import { json, PRIVATE_HEADERS, sameOrigin } from "@/features/payments/server/http";
import { PAYMENT_DOCUMENT_BUCKET } from "@/features/payments/types";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!await currentAdmin()) return json({ error: "Akses ditolak." }, 403);
    const order = await findOrder((await context.params).id); if (!order) return json({ error: "Pesanan tidak ditemukan." }, 404);
    const { data, error } = await paymentAdmin().storage.from(PAYMENT_DOCUMENT_BUCKET).createSignedUrl(order.document_key, 60);
    if (error || !data?.signedUrl) throw new Error("DOWNLOAD_UNAVAILABLE");
    return new Response(null, { status: 302, headers: { ...PRIVATE_HEADERS, Location: data.signedUrl, "Referrer-Policy": "no-referrer" } });
  } catch { return json({ error: "Dokumen belum dapat diunduh." }, 503); }
}
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return json({ error: "Permintaan tidak diizinkan." }, 403);
  try {
    if (!await currentAdmin()) return json({ error: "Akses ditolak." }, 403);
    const raw = await request.text(); if (raw.length > 128 || JSON.parse(raw).action !== "process") return json({ error: "Permintaan tidak valid." }, 400);
    const { data, error } = await paymentAdmin().database.from("duitku_orders").update({ fulfillment_status: "processing" }).eq("id", (await context.params).id).eq("status", "paid").in("fulfillment_status", ["pending", "failed"]).select("id");
    if (error) throw new Error("UPDATE_FAILED"); if (!data?.length) return json({ error: "Pesanan belum dibayar atau sudah diproses." }, 409);
    return json({ updated: true });
  } catch { return json({ error: "Pesanan belum dapat diperbarui." }, 503); }
}
