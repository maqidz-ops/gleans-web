import { currentAdmin } from "@/features/auth/session";
import { ORDER_COLUMNS, paymentAdmin } from "@/features/payments/server/repository";
import { json } from "@/features/payments/server/http";
export async function GET() {
  try {
    if (!await currentAdmin()) return json({ error: "Akses ditolak." }, 403);
    const { data, error } = await paymentAdmin().database.from("duitku_orders").select(`${ORDER_COLUMNS},whatsapp,document_bytes`).order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error("DATABASE_UNAVAILABLE"); return json({ orders: data });
  } catch { return json({ error: "Pesanan belum dapat dimuat." }, 503); }
}
