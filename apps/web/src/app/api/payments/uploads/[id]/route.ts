import { currentAdmin } from "@/features/auth/session";
import { guestSession } from "@/features/payments/server/guest";
import { findUpload, freezeUpload } from "@/features/payments/server/uploads";
import { findOrder, paymentAdmin } from "@/features/payments/server/repository";
import { json, sameOrigin } from "@/features/payments/server/http";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return json({ error: "Permintaan tidak diizinkan." }, 403);
  try {
    const { id } = await context.params;
    if (!/^[a-f0-9-]{36}$/.test(id)) return json({ error: "Unggahan tidak ditemukan." }, 404);
    const guest = await guestSession(); const ticket = await findUpload(id);
    if (!guest || !ticket || ticket.guest_hash !== guest.hash || Date.parse(ticket.expires_at) <= Date.now()) return json({ error: "Unggahan tidak ditemukan atau telah kedaluwarsa. Unggah kembali." }, 404);
    if (ticket.purpose === "report" && !await currentAdmin()) return json({ error: "Akses ditolak." }, 403);
    await freezeUpload(ticket);
    if (ticket.purpose === "report") {
      const order = await findOrder(ticket.order_id!);
      if (!order || order.status !== "paid") return json({ error: "Pembayaran belum terverifikasi." }, 409);
      if (order.fulfillment_status !== "completed") {
        const stored = (await findUpload(id))!; const now = Date.now();
        const { error } = await paymentAdmin().database.from("duitku_orders").update({ fulfillment_status: "completed", report_key: stored.final_key, report_url: stored.document_url, report_name: stored.document_name, completed_at: new Date(now).toISOString(), report_expires_at: new Date(now + 86400000).toISOString() }).eq("id", order.id).eq("status", "paid").neq("fulfillment_status", "completed");
        if (error) throw new Error("REPORT_UNAVAILABLE");
      }
    }
    return json({ ticket: id, confirmed: true });
  } catch (error) {
    const invalid = error instanceof Error && error.message === "INVALID_DOCUMENT_FORMAT";
    return json({ error: invalid ? "Isi dokumen tidak sesuai format file. Silakan unggah file yang valid." : "Dokumen belum dapat dikonfirmasi. Silakan unggah kembali." }, invalid ? 400 : 503);
  }
}
