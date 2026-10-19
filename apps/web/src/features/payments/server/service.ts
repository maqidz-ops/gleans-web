import "server-only";
import { transactionStatus } from "./duitku";
import { paymentAdmin, type StoredOrder } from "./repository";

// Re-query Duitku: callback resultCode and return URL parameters cannot prove payment.
export async function reconcilePayment(order: StoredOrder) {
  const result = await transactionStatus(order.id);
  if (result.merchantOrderId !== order.id || Number(result.amount) !== order.amount || (order.reference && result.reference !== order.reference)) throw new Error("PAYMENT_MISMATCH");
  const status = result.statusCode === "00" ? "paid" : result.statusCode === "02" ? "expired" : "pending";
  const updates = { status, reference: result.reference, ...(status === "paid" ? { paid_at: new Date().toISOString() } : {}), updated_at: new Date().toISOString(), checked_at: new Date().toISOString() };
  // A settled payment never regresses due to delayed callbacks or concurrent checks.
  const { error } = await paymentAdmin().database.from("duitku_orders").update(updates).eq("id", order.id).neq("status", "paid");
  if (error) throw new Error("DATABASE_UNAVAILABLE");
}
