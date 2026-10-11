"use server";
import { logout } from "./user-actions";
// Admin uses the same SDK-managed cookies and remember preference as users.
export async function signOutAdmin() {
  return logout();
}
