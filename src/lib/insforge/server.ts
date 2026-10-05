import "server-only";
import { cookies } from "next/headers";
import { createServerClient, createAuthActions } from "@insforge/sdk/ssr";

export function isAuthConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_INSFORGE_URL && process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY);
}
export async function serverClient() {
  return createServerClient({ cookies: await cookies() });
}
export async function authActions() {
  return createAuthActions({ cookies: await cookies() });
}
export async function currentUser() {
  if (!isAuthConfigured()) return null;
  const client = await serverClient();
  const { data, error } = await client.auth.getCurrentUser();
  return error ? null : data?.user ?? null;
}
export function appUrl(path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").toString();
}
