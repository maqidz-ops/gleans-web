import { z } from "zod";
import { duitkuConfig, validSignature } from "@/features/payments/server/duitku";
import { findOrder } from "@/features/payments/server/repository";
import { reconcilePayment } from "@/features/payments/server/service";
export const runtime = "nodejs";
const callbackSchema = z.object({ merchantCode: z.string().min(1), amount: z.string().regex(/^\d+$/), merchantOrderId: z.string().min(1).max(50), reference: z.string().min(1).max(255), signature: z.string().length(64) });
export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return new Response("Unsupported content type", { status: 415 });
    const raw = await request.text();
    if (raw.length > 8192) return new Response("Payload too large", { status: 413 });
    const parsed = callbackSchema.safeParse(Object.fromEntries(new URLSearchParams(raw)));
    if (!parsed.success) return new Response("Invalid callback", { status: 400 });
    const input = parsed.data;
    const { merchantCode, apiKey } = duitkuConfig();
    if (input.merchantCode !== merchantCode || !validSignature(`${merchantCode}${input.amount}${input.merchantOrderId}`, input.signature, apiKey)) return new Response("Invalid signature", { status: 401 });
    const order = await findOrder(input.merchantOrderId);
    if (!order || Number(input.amount) !== order.amount || (order.reference && input.reference !== order.reference)) return new Response("Order mismatch", { status: 400 });
    if (order.status !== "paid") await reconcilePayment(order);
    return new Response("OK", { status: 200 });
  } catch { return new Response("Temporary processing failure", { status: 503 }); }
}
