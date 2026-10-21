import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

// Live payments require a separate reviewed rollout; this integration is Sandbox only.
export function duitkuConfig() {
  const merchantCode = process.env.DUITKU_MERCHANT_CODE;
  const apiKey = process.env.DUITKU_API_KEY;
  if (process.env.DUITKU_ENV !== "sandbox" || !merchantCode || !apiKey) throw new Error("PAYMENTS_UNAVAILABLE");
  return { merchantCode, apiKey };
}
export function signature(value: string, key: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}
export function validSignature(value: string, received: string, key: string) {
  return /^[a-f0-9]{64}$/i.test(received) && timingSafeEqual(Buffer.from(signature(value, key), "hex"), Buffer.from(received, "hex"));
}
export function allowedPaymentUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && (url.hostname === "sandbox.duitku.com" || url.hostname === "api-sandbox.duitku.com"); } catch { return false; }
}
export class InvoiceRejected extends Error {
  constructor(public readonly publicMessage = "Pembayaran QRIS belum dapat dibuat. Silakan coba kembali beberapa saat lagi.") { super("INVOICE_REJECTED"); }
}
export function callbackOrigin() {
  const base = process.env.DUITKU_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!base) throw new Error("PAYMENTS_UNAVAILABLE");
  const origin = new URL(base);
  if (origin.protocol !== "https:") throw new Error("PUBLIC_CALLBACK_REQUIRED");
  return origin;
}
async function post(path: string, payload: Record<string, unknown>) {
  const response = await fetch(`https://sandbox.duitku.com/webapi/api/merchant/${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    cache: "no-store", signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    if (path === "v2/inquiry" && [400, 401, 403, 422].includes(response.status)) {
      const error = await response.json().catch(() => ({}));
      const minimum = typeof error.Message === "string" ? error.Message.match(/^Minimum Payment (\d+) IDR$/i)?.[1] : null;
      throw new InvoiceRejected(minimum ? `QRIS membutuhkan pembayaran minimal Rp ${Number(minimum).toLocaleString("id-ID")}. Buat pesanan baru tanpa promo atau hubungi support.` : undefined);
    }
    throw new Error("GATEWAY_UNAVAILABLE");
  }
  return response.json();
}
export async function paymentMethods(amount: number) {
  const { merchantCode, apiKey } = duitkuConfig();
  const datetime = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());
  const data = await post("paymentmethod/getpaymentmethod", { merchantcode: merchantCode, amount, datetime, signature: signature(`${merchantCode}${amount}${datetime}`, apiKey) });
  if (data.responseCode !== "00") throw new Error("GATEWAY_UNAVAILABLE");
  return z.array(z.object({ paymentMethod: z.string().min(1).max(2), paymentName: z.string(), totalFee: z.string() })).parse(data.paymentFee);
}
// QRIS channel choice is server-owned. Never fall back to VA, cards or e-wallet checkout.
export function isQrisMethod(method: string) { return ["SQ", "NQ", "SP"].includes(method); }
export function selectQrisMethod(methods: Awaited<ReturnType<typeof paymentMethods>>) {
  const method = ["SQ", "NQ", "SP"].map(code => methods.find(method => method.paymentMethod === code)).find(Boolean);
  if (!method) throw new Error("QRIS_UNAVAILABLE");
  return method;
}
export async function createInvoice(order: { id: string; amount: number; document_name: string }, method: string, customer: { email: string; name: string; whatsapp: string }) {
  if (!isQrisMethod(method)) throw new Error("QRIS_ONLY");
  const { merchantCode, apiKey } = duitkuConfig();
  const origin = callbackOrigin();
  const data = await post("v2/inquiry", {
    merchantCode, paymentAmount: order.amount, paymentMethod: method, merchantOrderId: order.id,
    productDetails: "Gleans Shield — Sandbox", customerVaName: customer.name.slice(0, 20),
    ...(customer.email ? { email: customer.email } : {}), phoneNumber: customer.whatsapp,
    itemDetails: [{ name: "Pemeriksaan dokumen Gleans Shield (Sandbox)", price: order.amount, quantity: 1 }],
    callbackUrl: new URL("/api/payments/duitku/callback", origin).toString(),
    returnUrl: new URL(`/pembayaran?order=${order.id}`, origin).toString(),
    signature: signature(`${merchantCode}${order.id}${order.amount}`, apiKey), expiryPeriod: 60,
  });
  if (data.statusCode !== "00") throw new InvoiceRejected();
  if (data.merchantCode !== merchantCode || Number(data.amount) !== order.amount || !allowedPaymentUrl(data.paymentUrl)) throw new Error("INVALID_GATEWAY_RESPONSE");
  return z.object({ reference: z.string().min(1), paymentUrl: z.string().url(), qrString: z.string().optional().nullable() }).parse(data);
}
export async function transactionStatus(orderId: string) {
  const { merchantCode, apiKey } = duitkuConfig();
  const data = await post("transactionStatus", { merchantCode, merchantOrderId: orderId, signature: signature(`${merchantCode}${orderId}`, apiKey) });
  return z.object({ merchantOrderId: z.string(), reference: z.string(), amount: z.union([z.string(), z.number()]), statusCode: z.enum(["00", "01", "02"]) }).parse(data);
}
