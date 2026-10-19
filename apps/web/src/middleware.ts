import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@insforge/sdk/ssr/middleware";
import { SESSION_PREFERENCE_COOKIE, isPersistentSession, sessionCookieSettings } from "@/features/auth/session-preference";
export async function middleware(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_INSFORGE_URL && process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
  if (!configured && (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/akun") || request.nextUrl.pathname.startsWith("/admin"))) return NextResponse.redirect(new URL("/masuk", request.url));
  const response = NextResponse.next({ request });
  if (configured) await updateSession({ requestCookies: request.cookies, responseCookies: response.cookies, ...sessionCookieSettings(isPersistentSession(request.cookies.get(SESSION_PREFERENCE_COOKIE)?.value)) });
  const forwarded = NextResponse.next({ request });
  for (const cookie of response.cookies.getAll()) forwarded.cookies.set(cookie);
  return forwarded;
}
export const config = { matcher: ["/dashboard/:path*", "/akun", "/admin/:path*", "/pembayaran", "/api/payments/orders/:path*"] };
