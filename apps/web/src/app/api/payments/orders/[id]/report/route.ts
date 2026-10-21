import { dashboardUser } from "@/features/auth/server";
import { findOrder, paymentAdmin } from "@/features/payments/server/repository";
import { orderAccess } from "@/features/payments/server/guest";
import { reportAvailability } from "@/features/payments/server/report";
import { PAYMENT_DOCUMENT_BUCKET } from "@/features/payments/types";
import { json, PRIVATE_HEADERS } from "@/features/payments/server/http";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const order = await findOrder((await context.params).id); if (!order) return json({ error: "Pesanan tidak ditemukan." }, 404);
    const access = await orderAccess(order, (await dashboardUser())?.id);
    const status = reportAvailability(order, access.allowed);
    if (status !== 200) return json({ error: status === 403 ? "Gunakan tautan atau kode akses pesanan untuk mengunduh hasil." : status === 410 ? "Masa unduh laporan sudah berakhir." : "Laporan belum tersedia." }, status);
    const remaining = Math.floor((Date.parse(order.report_expires_at!) - Date.now()) / 1000);
    if (remaining < 1) return json({ error: "Masa unduh laporan sudah berakhir." }, 410);
    const { data, error } = await paymentAdmin().storage.from(PAYMENT_DOCUMENT_BUCKET).createSignedUrl(order.report_key!, Math.min(60, remaining));
    if (error || !data?.signedUrl) throw new Error("REPORT_UNAVAILABLE");
    return new Response(null, { status: 302, headers: { ...PRIVATE_HEADERS, Location: data.signedUrl, "Referrer-Policy": "no-referrer" } });
  } catch { return json({ error: "Laporan belum dapat diunduh. Silakan coba kembali." }, 503); }
}
