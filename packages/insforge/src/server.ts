import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";

/** Request-scoped client. Authorization policies belong to the consuming app. */
export async function serverClient() {
  return createServerClient({ cookies: await cookies() });
}
