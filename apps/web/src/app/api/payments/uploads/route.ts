import { randomUUID } from "node:crypto";
import { z } from "zod";
import { dashboardUser } from "@/features/auth/server";
import { currentAdmin } from "@/features/auth/session";
import { guestSession } from "@/features/payments/server/guest";
import { allowOrderLookup, lookupRateKey } from "@/features/payments/server/lookup-limit";
import { findOrder, paymentAdmin } from "@/features/payments/server/repository";
import { json, sameOrigin } from "@/features/payments/server/http";
import { PAYMENT_DOCUMENT_BUCKET } from "@/features/payments/types";
export const runtime = "nodejs";
const schema = z.object({ name: z.string().trim().min(1).max(200).regex(/^[^/\\\x00-\x1f]+\.(pdf|docx?|txt)$/i), bytes: z.number().int().min(1).max(26214400), purpose: z.enum(["document", "report"]).default("document"), orderId: z.string().max(50).optional() }).strict();
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Permintaan tidak diizinkan." }, 403);
  try {
    const raw = await request.text(); if (raw.length > 1024) return json({ error: "Data terlalu besar." }, 413);
    const parsed = schema.safeParse(JSON.parse(raw)); if (!parsed.success) return json({ error: "Dokumen tidak valid. Maksimal 25MB." }, 400);
    const input = parsed.data;
    if (!await allowOrderLookup(request, "upload")) return json({ error: "Terlalu banyak unggahan. Coba kembali dalam satu menit." }, 429);
    const user = await dashboardUser();
    if (input.purpose === "report") {
      if (!await currentAdmin()) return json({ error: "Akses ditolak." }, 403);
      const order = input.orderId ? await findOrder(input.orderId) : null;
      if (!order || order.status !== "paid" || order.fulfillment_status === "completed" || !/\.pdf$/i.test(input.name)) return json({ error: "Laporan PDF hanya dapat diunggah untuk pesanan yang sudah dibayar dan belum selesai." }, 400);
    }
    const guest = (await guestSession(true))!;
    const id = randomUUID(); const extension = input.name.split(".").pop()!.toLowerCase();
    const contentType = extension === "pdf" ? "application/pdf" : extension === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : extension === "doc" ? "application/msword" : "text/plain";
    const stagingKey = `staging/${id}.${extension}`;
    const finalKey = `sealed/${id}/${input.purpose === "report" ? "hasil" : "dokumen"}.${extension}`;
    const admin = paymentAdmin();
    const strategy = await admin.getHttpClient().post<{ method: string; uploadUrl: string; fields: Record<string, string>; confirmRequired: boolean; confirmUrl: string }>(`/api/storage/buckets/${PAYMENT_DOCUMENT_BUCKET}/upload-strategy`, { filename: stagingKey, contentType, size: input.bytes });
    if (strategy.method !== "presigned" || !strategy.confirmRequired || !strategy.confirmUrl.startsWith(`/api/storage/buckets/${PAYMENT_DOCUMENT_BUCKET}/`) || !strategy.uploadUrl.startsWith("https://")) throw new Error("UPLOAD_UNAVAILABLE");
    const { data: claimed, error } = await admin.database.rpc("claim_shield_upload", { p_source: lookupRateKey(request, process.env.INSFORGE_API_KEY!, "upload-quota"), p_ticket: { id, guest_hash: guest.hash, owner_id: user?.id ?? null, purpose: input.purpose, order_id: input.purpose === "report" ? input.orderId : null, document_name: input.name, staging_key: stagingKey, final_key: finalKey, bytes: input.bytes, content_type: contentType, confirm_url: strategy.confirmUrl } });
    if (error) throw new Error("UPLOAD_UNAVAILABLE");
    if (!claimed) return json({ error: "Kuota unggahan sementara tercapai. Coba kembali nanti atau hubungi support." }, 429);
    return json({ ticket: id, uploadUrl: strategy.uploadUrl, fields: strategy.fields });
  } catch (error) {
    return json({ error: error instanceof SyntaxError ? "Data unggahan tidak valid." : "Unggahan belum dapat disiapkan. Silakan coba kembali." }, error instanceof SyntaxError ? 400 : 503);
  }
}
