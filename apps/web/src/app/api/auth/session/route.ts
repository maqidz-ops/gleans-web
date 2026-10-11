import { cookies } from "next/headers";
import { updateSession } from "@insforge/sdk/ssr/middleware";
import { isAuthConfigured, serverClient } from "@/features/auth/server";
import { accountLandingPage } from "@/features/auth/session";
import { isPersistentSession, SESSION_PREFERENCE_COOKIE, sessionCookieSettings } from "@/features/auth/session-preference";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function GET() {
  if (!isAuthConfigured()) return Response.json({ error: "Auth unavailable" }, { status: 503, headers });
  try {
    const store = await cookies();
    const session = await updateSession({
      requestCookies: store,
      responseCookies: store,
      ...sessionCookieSettings(isPersistentSession(store.get(SESSION_PREFERENCE_COOKIE)?.value)),
    });
    if (!session.accessToken) return Response.json({ account: null }, { headers });
    const { data, error } = await (await serverClient()).auth.getCurrentUser();
    if (error && error.statusCode !== 401) return Response.json({ error: "Session unavailable" }, { status: 503, headers });
    const user = !error ? data?.user : null;
    if (!user) return Response.json({ account: null }, { headers });
    const name = typeof user.profile?.name === "string" ? user.profile.name.trim() : "";
    const dashboardHref = accountLandingPage(user);
    return Response.json({ account: {
      name: name || user.email.split("@")[0],
      email: user.email,
      dashboardHref,
      settingsHref: `${dashboardHref}/pengaturan`,
    } }, { headers });
  } catch {
    return Response.json({ error: "Session unavailable" }, { status: 503, headers });
  }
}
