import { z } from "zod";
const sessionSchema = z.object({ account: z.object({ id: z.string().uuid() }).nullable() });

/** Validate/refresh through our SSR route; browser auth.getCurrentUser uses a different session flow. */
export async function checkoutUserId(fetchSession: typeof fetch = fetch): Promise<string | null> {
  const response = await fetchSession("/api/auth/session", { cache: "no-store", credentials: "same-origin" });
  if (!response.ok) throw new Error("Layanan akun belum dapat diakses. Silakan coba kembali.");
  const parsed = sessionSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Sesi akun belum dapat diperiksa. Muat ulang halaman lalu coba kembali.");
  return parsed.data.account?.id ?? null;
}
