import { createRefreshAuthRouter } from "@insforge/sdk/ssr";
import { isAuthConfigured } from "@/lib/insforge/server";

export async function POST(request: Request) {
  if (!isAuthConfigured()) return Response.json({ error: "Auth unavailable" }, { status: 503 });
  return createRefreshAuthRouter().POST(request);
}
