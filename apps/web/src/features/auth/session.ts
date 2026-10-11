import "server-only";
import { currentUser, isAuthConfigured } from "./server";
import { matchesAdmin, landingPage } from "./access";
export function adminIdentity() {
  return { id: process.env.GLEANS_ADMIN_USER_ID, email: process.env.GLEANS_ADMIN_EMAIL };
}
export function adminAuthConfigured() {
  const identity = adminIdentity();
  return Boolean(isAuthConfigured() && identity.id && identity.email);
}
export function isAdmin(user: { id: string; email: string } | null | undefined) {
  return matchesAdmin(user, adminIdentity());
}
export function accountLandingPage(user: { id: string; email: string }) {
  return landingPage(user, adminIdentity());
}
export async function currentAdmin() {
  if (!adminAuthConfigured()) return null;
  const user = await currentUser();
  return isAdmin(user) ? user : null;
}
