export const SHIELD_RETENTION_MS = 24 * 60 * 60 * 1000;
export function shieldAccess(completedAt: string | undefined, now = Date.now()) {
  const completed = completedAt ? Date.parse(completedAt) : NaN;
  if (!Number.isFinite(completed)) return { status: "unknown" as const, expiresAt: null, remainingMs: 0 };
  const expires = completed + SHIELD_RETENTION_MS;
  return { status: now >= expires ? "expired" as const : "available" as const, expiresAt: new Date(expires).toISOString(), remainingMs: Math.max(0, expires - now) };
}
