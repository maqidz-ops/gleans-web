import "server-only";
import { randomBytes } from "node:crypto";

export function invoiceNumber(): string {
  return `GLS-${randomBytes(6).toString("hex").toUpperCase()}`;
}

// The primary key is the final uniqueness check, including concurrent reservations.
export async function reserveInvoice<T extends { error: { code?: string; message: string } | null }>(reserve: (id: string) => PromiseLike<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const result = await reserve(invoiceNumber());
    if (attempt >= 2 || result.error?.code !== "23505" || !result.error.message.includes("duitku_orders_pkey")) return result;
  }
}
