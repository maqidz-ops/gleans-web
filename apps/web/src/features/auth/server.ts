import "server-only";
import { cookies } from "next/headers";
import { createServerClient, createAuthActions } from "@insforge/sdk/ssr";

import { SESSION_PREFERENCE_COOKIE, isPersistentSession, sessionCookieSettings } from "@/features/auth/session-preference";

export function isAuthConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_INSFORGE_URL && process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY);
}
export async function serverClient() {
  return createServerClient({ cookies: await cookies() });
}
export async function authActions(persistent?: boolean) {
  const store = await cookies();
  const remember = persistent ?? isPersistentSession(store.get(SESSION_PREFERENCE_COOKIE)?.value);
  return createAuthActions({ cookies: store, ...sessionCookieSettings(remember) });
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

export async function dashboardUser() {
  const user = await currentUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: typeof user.profile?.name === "string" && user.profile.name.trim() ? user.profile.name : user.email.split("@")[0],
    whatsapp: typeof user.profile?.whatsapp === "string" ? user.profile.whatsapp : "",
  };
}
