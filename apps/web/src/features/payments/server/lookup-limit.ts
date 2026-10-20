import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { paymentAdmin } from "./repository";

export function lookupRateKey(request: Request, secret: string, scope = "lookup"): string {
  // Vercel sets this header itself. Never trust arbitrary X-Forwarded-For values.
  const forwarded = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() : null;
  const address = forwarded && isIP(forwarded) ? forwarded : "shared-local";
  return createHmac("sha256", secret).update(`order-${scope}:${address}`).digest("hex");
}
export async function allowOrderLookup(request: Request, scope = "lookup"): Promise<boolean> {
  const secret = process.env.INSFORGE_API_KEY;
  if (!secret) throw new Error("LOOKUP_UNAVAILABLE");
  const { data, error } = await paymentAdmin().database.rpc("consume_order_lookup", { p_key: lookupRateKey(request, secret, scope) });
  if (error || typeof data !== "boolean") throw new Error("LOOKUP_UNAVAILABLE");
  return data;
}
