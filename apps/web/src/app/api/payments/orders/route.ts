import { uploadedFiles } from "@/features/payments/server/documents";
import { reserveInvoice } from "@/features/payments/server/invoice";
import { z } from "zod";
import { dashboardUser, serverClient } from "@/features/auth/server";
import { resolvePromo, whatsappSchema } from "@/features/orders/lib/pricing";
import { SHIELD_PRICE } from "@/lib/plans";
import { PAYMENT_DOCUMENT_BUCKET } from "@/features/payments/types";
import { duitkuConfig } from "@/features/payments/server/duitku";
import { paymentAdmin, ORDER_COLUMNS, publicOrder } from "@/features/payments/server/repository";
import { json, paymentError, sameOrigin } from "@/features/payments/server/http";

export const runtime = "nodejs";
const schema = z.object({ requestId: z.string().uuid(), documentName: z.string().trim().min(1).max(200).regex(/\.(pdf|docx?|txt)$/i), documentKey: z.string().min(1).max(300), words: z.number().int().min(0).max(25000), whatsapp: whatsappSchema, promo: z.string().max(40).optional() }).strict();
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Permintaan tidak diizinkan." }, 403);
  try {
    const user = await dashboardUser();
    if (!user) return json({ error: "Silakan masuk terlebih dahulu." }, 401);
    duitkuConfig();
    const raw = await request.text();
    if (raw.length > 4096) return json({ error: "Data pesanan terlalu besar." }, 413);
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return json({ error: "Data pesanan tidak valid." }, 400);
    const input = parsed.data;
    const admin = paymentAdmin();
    const { data: existing, error: lookupError } = await admin.database.from("duitku_orders").select(ORDER_COLUMNS).eq("owner_id", user.id).eq("request_key", input.requestId).maybeSingle();
    if (lookupError) throw new Error("DATABASE_UNAVAILABLE");
    if (existing) return json({ order: existing });
    if (!input.documentKey.startsWith(`${user.id}/`) || input.documentKey.includes("..")) return json({ error: "Dokumen tidak valid." }, 400);
    const client = await serverClient();
    const { data: files, error: fileError } = await client.storage.from(PAYMENT_DOCUMENT_BUCKET).list({ prefix: input.documentKey, limit: 2 });
    const file = files ? uploadedFiles(files).find(file => file.key === input.documentKey) : null;
    if (fileError || !file || file.size < 1 || file.size > 25 * 1024 * 1024) return json({ error: "Dokumen belum tersimpan. Silakan unggah kembali." }, 400);
    const promo = input.promo ? resolvePromo(input.promo, SHIELD_PRICE) : null;
    if (input.promo && !promo) return json({ error: "Kode promo tidak valid." }, 400);
    const { data, error } = await reserveInvoice(id => admin.database.rpc("reserve_duitku_order", {
      p_id: id, p_owner: user.id, p_request: input.requestId,
      p_email: user.email, p_name: user.name, p_whatsapp: input.whatsapp,
      p_document: input.documentName, p_key: file.key, p_url: file.url, p_bytes: file.size, p_words: input.words,
      p_amount: SHIELD_PRICE - (promo?.discount ?? 0), p_promo: promo?.code ?? null,
    }));
    if (error) { if (error.message.includes("RATE_LIMIT")) return json({ error: "Terlalu banyak pesanan. Silakan lanjutkan pesanan yang sudah ada atau coba lagi nanti." }, 429); throw new Error("DATABASE_UNAVAILABLE"); }
    return json({ order: publicOrder(data) }, 201);
  } catch (error) { if (error instanceof SyntaxError) return json({ error: "Data tidak valid." }, 400); return paymentError(error); }
}
export async function GET() {
  try {
    const user = await dashboardUser();
    if (!user) return json({ error: "Silakan masuk terlebih dahulu." }, 401);
    const { data, error } = await (await serverClient()).database.from("duitku_orders").select(ORDER_COLUMNS).eq("owner_id", user.id).order("created_at", { ascending: false }).limit(30);
    if (error) throw new Error("DATABASE_UNAVAILABLE");
    return json({ orders: data });
  } catch (error) { return paymentError(error); }
}
