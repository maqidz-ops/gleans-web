import { orderAccess } from "@/features/payments/server/guest";
import { dashboardUser, serverClient } from "@/features/auth/server";
import { LOOKUP_COLUMNS, PUBLIC_LOOKUP_COLUMNS, lookupSummary, orderLookupSchema, parseOrderLookup, type LookupOrder } from "@/features/orders/lib/lookup";
import { json, sameOrigin } from "@/features/payments/server/http";
import { paymentAdmin } from "@/features/payments/server/repository";
import { allowOrderLookup } from "@/features/payments/server/lookup-limit";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Permintaan tidak diizinkan." }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 512) return json({ error: "Pencarian terlalu panjang." }, 413);
    const parsed = orderLookupSchema.safeParse(JSON.parse(raw));
    const search = parsed.success ? parseOrderLookup(parsed.data.query) : null;
    if (!search) return json({ error: "Masukkan nomor invoice atau nomor WhatsApp yang valid." }, 400);
    if (!await allowOrderLookup(request)) {
      const response = json({ error: "Terlalu banyak pencarian. Tunggu satu menit lalu coba kembali." }, 429);
      response.headers.set("Retry-After", "60");
      return response;
    }
    const user = await dashboardUser();
    if (user) {
      let ownQuery = (await serverClient()).database.from("duitku_orders").select(LOOKUP_COLUMNS).eq("owner_id", user.id);
      ownQuery = search.kind === "invoice" ? ownQuery.eq("id", search.invoice) : ownQuery.in("whatsapp", search.numbers);
      const { data, error } = await ownQuery.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(30);
      if (error) throw new Error("LOOKUP_UNAVAILABLE");
      if (data?.length) return json({ orders: (data as LookupOrder[]).map(order => lookupSummary(order, search.kind, true)), limit: 30 });
    }
    // Only allowlisted order metadata is returned. Download capabilities never appear in lookup responses.
    let query = paymentAdmin().database.from("duitku_orders").select(`${PUBLIC_LOOKUP_COLUMNS},owner_id,guest_hash,access_hash`);
    query = search.kind === "invoice" ? query.eq("id", search.invoice) : query.in("whatsapp", search.numbers);
    const { data, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(30);
    if (error) throw new Error("LOOKUP_UNAVAILABLE");
    const orders = await Promise.all((data ?? []).map(async order => {
      const access = await orderAccess(order, user?.id);
      return lookupSummary(order as LookupOrder, search.kind, access.allowed);
    }));
    return json({ orders, limit: 30 });
  } catch (error) {
    if (error instanceof SyntaxError) return json({ error: "Data pencarian tidak valid." }, 400);
    return json({ error: "Pesanan belum dapat dicari. Silakan coba kembali." }, 503);
  }
}
