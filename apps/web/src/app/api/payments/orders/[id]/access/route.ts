import { findOrder } from "@/features/payments/server/repository";
import { matchesAccess, saveOrderAccess } from "@/features/payments/server/guest";
import { allowOrderLookup } from "@/features/payments/server/lookup-limit";
import { json, sameOrigin } from "@/features/payments/server/http";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return json({ error: "Permintaan tidak diizinkan." }, 403);
  try {
    const raw = await request.text(); if (raw.length > 256) return json({ error: "Kode akses tidak valid." }, 400);
    const { code } = JSON.parse(raw);
    if (typeof code !== "string" || !await allowOrderLookup(request, "access")) return json({ error: "Coba kembali dengan kode akses yang valid dalam satu menit." }, 429);
    const order = await findOrder((await context.params).id);
    if (!order || !matchesAccess(code, order.access_hash)) return json({ error: "Kode akses tidak cocok." }, 403);
    await saveOrderAccess(order.id, code); return json({ granted: true });
  } catch { return json({ error: "Akses pesanan belum dapat dipulihkan." }, 503); }
}
