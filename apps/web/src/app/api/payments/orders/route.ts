import { reserveInvoice } from "@/features/payments/server/invoice";
import { z } from "zod";
import { dashboardUser, serverClient } from "@/features/auth/server";
import { resolvePromo, whatsappSchema } from "@/features/orders/lib/pricing";
import { SHIELD_PRICE } from "@/lib/plans";
import { duitkuConfig } from "@/features/payments/server/duitku";
import { paymentAdmin, ORDER_COLUMNS, publicOrder, type StoredOrder } from "@/features/payments/server/repository";
import { guestSession, accessDigest, orderAccessCode } from "@/features/payments/server/guest";
import { json, paymentError, sameOrigin } from "@/features/payments/server/http";
export const runtime = "nodejs";
const schema = z.object({ requestId: z.string().uuid(), ticketId: z.string().uuid(), words: z.number().int().min(0).max(25000), whatsapp: whatsappSchema, email: z.string().trim().email().max(50).optional(), name: z.string().trim().min(1).max(80).optional(), promo: z.string().max(40).optional() }).strict();
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Permintaan tidak diizinkan." }, 403);
  try {
    duitkuConfig();
    const raw = await request.text(); if (raw.length > 4096) return json({ error: "Data pesanan terlalu besar." }, 413);
    const parsed = schema.safeParse(JSON.parse(raw)); if (!parsed.success) return json({ error: "Data pesanan tidak valid." }, 400);
    const input = parsed.data; const user = await dashboardUser(); const guest = await guestSession();
    if (!guest) return json({ error: "Unggah dokumen terlebih dahulu." }, 400);
    const email = input.email || user?.email;
    if (!email) return json({ error: "Masukkan email untuk bukti pembayaran." }, 400);
    const promo = input.promo ? resolvePromo(input.promo, SHIELD_PRICE) : null;
    if (input.promo && !promo) return json({ error: "Kode promo tidak valid." }, 400);
    const { data, error } = await reserveInvoice(id => paymentAdmin().database.rpc("reserve_guest_order", {
      p_id: id, p_owner: user?.id ?? null, p_guest: guest.hash, p_access: accessDigest(orderAccessCode(guest.secret, id)), p_request: input.requestId, p_ticket: input.ticketId,
      p_email: email, p_name: input.name || user?.name || "Pelanggan Gleans", p_whatsapp: input.whatsapp,
      p_words: input.words, p_amount: SHIELD_PRICE - (promo?.discount ?? 0), p_promo: promo?.code ?? null,
    }));
    if (error) {
      if (error.message.includes("RATE_LIMIT")) return json({ error: "Terlalu banyak pesanan. Lanjutkan pesanan yang sudah ada atau coba lagi nanti." }, 429);
      if (error.message.includes("INVALID_UPLOAD")) return json({ error: "Dokumen tidak valid atau telah digunakan. Silakan unggah kembali." }, 400);
      throw new Error("DATABASE_UNAVAILABLE");
    }
    const order = data as StoredOrder;
    return json({ order: publicOrder(order), access_code: order.guest_hash === guest.hash ? orderAccessCode(guest.secret, order.id) : null }, 201);
  } catch (error) { if (error instanceof SyntaxError) return json({ error: "Data tidak valid." }, 400); return paymentError(error); }
}
export async function GET() {
  try {
    const user = await dashboardUser(); if (!user) return json({ error: "Silakan masuk terlebih dahulu." }, 401);
    const { data, error } = await (await serverClient()).database.from("duitku_orders").select(ORDER_COLUMNS).eq("owner_id", user.id).order("created_at", { ascending: false }).limit(30);
    if (error) throw new Error("DATABASE_UNAVAILABLE"); return json({ orders: data });
  } catch (error) { return paymentError(error); }
}
