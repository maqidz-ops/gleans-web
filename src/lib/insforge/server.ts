import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";

export function adminAuthConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_INSFORGE_URL && process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY && process.env.GLEANS_ADMIN_USER_ID);
}

export async function currentAdmin() {
  if (!adminAuthConfigured()) return null;
  const client = createServerClient({ cookies: await cookies() });
  const { data, error } = await client.auth.getCurrentUser();
  if (error || !data?.user || data.user.id !== process.env.GLEANS_ADMIN_USER_ID || data.user.email.toLowerCase() !== process.env.GLEANS_ADMIN_EMAIL?.toLowerCase()) return null;
  return data.user;
}
