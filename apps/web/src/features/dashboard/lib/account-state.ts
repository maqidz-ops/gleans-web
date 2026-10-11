import type { DashboardUser } from "@/features/auth/types";
import { STORAGE_KEY, type DemoState } from "./model";
export function dashboardStorageKey(account?: DashboardUser) {
  return account ? `${STORAGE_KEY}:user:${account.id}` : STORAGE_KEY;
}
export function withAccount(state: DemoState, account?: DashboardUser): DemoState {
  return account ? { ...state, profile: { name: account.name, email: account.email, whatsapp: account.whatsapp } } : state;
}
