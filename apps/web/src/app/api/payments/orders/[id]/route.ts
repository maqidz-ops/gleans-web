import { z } from "zod";
import { dashboardUser } from "@/features/auth/server";
import { createInvoice, paymentMethods, callbackOrigin, InvoiceRejected, selectQrisMethod } from "@/features/payments/server/duitku";
import { findOrder, paymentAdmin, publicOrder } from "@/features/payments/server/repository";
import { reconcilePayment } from "@/features/payments/server/service";
import { json, paymentError, sameOrigin } from "@/features/payments/server/http";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const user = await dashboardUser();
    if (!user) return json({ error: "Silakan masuk terlebih dahulu." }, 401);
    const order = await findOrder((await context.params).id, user.id);
    return order ? json({ order: publicOrder(order) }) : json({ error: "Pesanan tidak ditemukan." }, 404);
  } catch (error) { return paymentError(error); }
}
export async function POST(request: Request, context: Context) {
  if (!sameOrigin(request)) return json({ error: "Permintaan tidak diizinkan." }, 403);
  try {
    const user = await dashboardUser();
    if (!user) return json({ error: "Silakan masuk terlebih dahulu." }, 401);
    const order = await findOrder((await context.params).id, user.id);
    if (!order) return json({ error: "Pesanan tidak ditemukan." }, 404);
    const raw = await request.text();
    if (raw.length > 1024) return json({ error: "Data terlalu besar." }, 413);
    const parsed = z.object({ action: z.enum(["pay", "check"]) }).strict().safeParse(JSON.parse(raw));
    if (!parsed.success) return json({ error: "Permintaan tidak valid." }, 400);
    const admin = paymentAdmin();
    if (parsed.data.action === "check") {
      if (order.status !== "draft" && order.status !== "paid" && (!order.checked_at || Date.now() - new Date(order.checked_at).getTime() >= 30_000)) {
        // Claim a check slot atomically; never poll Duitku at every page refresh.
        const { data: claimed, error } = await admin.database.rpc("claim_duitku_check", { p_id: order.id });
        if (error) throw new Error("DATABASE_UNAVAILABLE");
        if (claimed) await reconcilePayment(order);
      }
    } else if (order.status === "draft") {
      callbackOrigin();
      const method = selectQrisMethod(await paymentMethods(order.amount));
      const { data: claimed, error } = await admin.database.from("duitku_orders").update({ status: "creating", payment_method: method.paymentMethod, expires_at: new Date(Date.now() + 3600_000).toISOString() }).eq("id", order.id).eq("status", "draft").select("id");
      if (error) throw new Error("DATABASE_UNAVAILABLE");
      if (!claimed?.length) return json({ error: "Pembayaran sedang dibuat. Muat ulang pesanan." }, 409);
      try {
        const invoice = await createInvoice(order, method.paymentMethod, { email: order.email, name: order.customer_name, whatsapp: order.whatsapp });
        const { error: saveError } = await admin.database.from("duitku_orders").update({ status: "pending", payment_url: invoice.paymentUrl, reference: invoice.reference, qr_string: invoice.qrString ?? null }).eq("id", order.id).eq("status", "creating");
        if (saveError) throw new Error("DATABASE_UNAVAILABLE");
      } catch (error) {
        // Only a definite rejection allows retry. An ambiguous timeout must not create a duplicate invoice.
        if (error instanceof InvoiceRejected) {
          const { error: resetError } = await admin.database.from("duitku_orders").update({ status: "draft", payment_method: null, expires_at: null }).eq("id", order.id).eq("status", "creating");
          if (resetError) throw new Error("DATABASE_UNAVAILABLE");
          return json({ error: error.publicMessage }, 400);
        }
        throw error;
      }
    }
    const result = await findOrder(order.id, user.id);
    return json({ order: result && publicOrder(result) });
  } catch (error) { if (error instanceof SyntaxError) return json({ error: "Data tidak valid." }, 400); return paymentError(error); }
}
