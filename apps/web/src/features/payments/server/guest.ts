import "server-only";
import { cookies } from "next/headers";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { StoredOrder } from "./repository";
const GUEST_COOKIE = "gleans_guest";
const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 60 * 86400 };
export const accessDigest = (value: string) => createHash("sha256").update(value).digest("hex");
export const validAccessCode = (value: string) => /^[A-Za-z0-9_-]{43}$/.test(value);
export const orderAccessCode = (secret: string, id: string) => createHmac("sha256", secret).update(`gleans-order:${id}`).digest("base64url");
export function matchesAccess(code: string, digest: string | null | undefined) {
  return validAccessCode(code) && Boolean(digest && /^[a-f0-9]{64}$/.test(digest) && timingSafeEqual(Buffer.from(accessDigest(code), "hex"), Buffer.from(digest, "hex")));
}
export async function guestSession(create = false) {
  const store = await cookies();
  let secret = store.get(GUEST_COOKIE)?.value;
  if (!secret || !validAccessCode(secret)) {
    if (!create) return null;
    secret = randomBytes(32).toString("base64url"); store.set(GUEST_COOKIE, secret, options);
  }
  return { secret, hash: accessDigest(secret) };
}
export const accessCookieName = (id: string) => `gleans_access_${id}`;
export async function saveOrderAccess(id: string, code: string) { (await cookies()).set(accessCookieName(id), code, options); }
export async function orderAccess(order: Pick<StoredOrder, "id" | "owner_id" | "guest_hash" | "access_hash">, userId?: string) {
  const guest = await guestSession();
  const recovered = (await cookies()).get(accessCookieName(order.id))?.value;
  const code = guest && guest.hash === order.guest_hash ? orderAccessCode(guest.secret, order.id) : recovered;
  return { allowed: Boolean(userId && userId === order.owner_id) || Boolean(code && matchesAccess(code, order.access_hash)), code: code && matchesAccess(code, order.access_hash) ? code : null };
}
