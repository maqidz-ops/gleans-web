import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@insforge/sdk/ssr/middleware";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  if (process.env.NEXT_PUBLIC_INSFORGE_URL && process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY) {
    await updateSession({ requestCookies: request.cookies, responseCookies: response.cookies });
  }
  // Forward the refreshed request cookies before Server Components render.
  const forwarded = NextResponse.next({ request });
  for (const cookie of response.cookies.getAll()) forwarded.cookies.set(cookie);
  return forwarded;
}
export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon|.*\\..*).*)"] };
