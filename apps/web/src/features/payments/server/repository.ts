import "server-only";
import { createAdminClient } from "@insforge/sdk";
import type { PaymentOrder } from "../types";
export const ORDER_COLUMNS = "id,document_name,amount,status,payment_method,payment_url,qr_string,reference,created_at,expires_at,paid_at";
export type StoredOrder = PaymentOrder & { owner_id: string; email: string; customer_name: string; whatsapp: string; document_key: string; document_url: string; checked_at: string | null };
export function paymentAdmin() {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const apiKey = process.env.INSFORGE_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("PAYMENTS_UNAVAILABLE");
  return createAdminClient({ baseUrl, apiKey });
}
export async function findOrder(id: string, ownerId?: string): Promise<StoredOrder | null> {
  let query = paymentAdmin().database.from("duitku_orders").select(`${ORDER_COLUMNS},owner_id,email,customer_name,whatsapp,document_key,document_url,checked_at`).eq("id", id);
  if (ownerId) query = query.eq("owner_id", ownerId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error("DATABASE_UNAVAILABLE");
  return data as StoredOrder | null;
}
export function publicOrder(order: PaymentOrder): PaymentOrder {
  return Object.fromEntries(ORDER_COLUMNS.split(",").map(key => [key, order[key as keyof PaymentOrder]])) as PaymentOrder;
}
