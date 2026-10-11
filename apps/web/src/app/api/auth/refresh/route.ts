import { cookies } from "next/headers";
import { SESSION_PREFERENCE_COOKIE, isPersistentSession, sessionCookieSettings } from "@/features/auth/session-preference";
import { createRefreshAuthRouter } from "@insforge/sdk/ssr";
import { isAuthConfigured } from "@/features/auth/server";

export async function POST(request: Request) {
  if (!isAuthConfigured()) return Response.json({ error: "Auth unavailable" }, { status: 503 });
  const store = await cookies();
  return createRefreshAuthRouter(sessionCookieSettings(isPersistentSession(store.get(SESSION_PREFERENCE_COOKIE)?.value))).POST(request);
}
