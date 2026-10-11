import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@insforge/sdk/ssr/middleware";

export async function middleware(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_INSFORGE_URL || !process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || !process.env.GLEANS_ADMIN_USER_ID) return NextResponse.redirect(new URL("/masuk", request.url));
  const response = NextResponse.next({ request });
  await updateSession({ requestCookies: request.cookies, responseCookies: response.cookies });
  return response;
}

export const config = { matcher: ["/admin/:path*"] };
