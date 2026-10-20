import "server-only";
export function reportAvailability(order: { status: string; fulfillment_status: string; report_key: string | null; report_expires_at: string | null }, allowed: boolean, now = Date.now()) {
  if (!allowed) return 403;
  if (order.status !== "paid") return 409;
  if (order.fulfillment_status !== "completed" || !order.report_key) return 404;
  if (!order.report_expires_at || Date.parse(order.report_expires_at) <= now || !Number.isFinite(Date.parse(order.report_expires_at))) return 410;
  return 200;
}
