import type { AuthCookieSettings } from "@insforge/sdk/ssr";

export const SESSION_PREFERENCE_COOKIE = "gleans_session_preference";

export function sessionCookieSettings(persistent: boolean): AuthCookieSettings {
  return persistent ? {} : {
    options: {
      accessToken: { expires: undefined },
      refreshToken: { expires: undefined },
    },
  };
}

export function isPersistentSession(value?: string) {
  // Existing sessions retain their SDK-managed expiration.
  return value !== "session";
}

export function sessionPreferenceOptions(persistent: boolean) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(persistent ? { maxAge: 30 * 24 * 60 * 60 } : {}),
  };
}
