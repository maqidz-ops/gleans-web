"use client";
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { demoReducer, demoSchema, upgradeDemoRetention, initialDemo, type DemoAction, type DemoState } from "@/features/dashboard/lib/model";
import type { DashboardUser } from "@/features/auth/types";
import { dashboardStorageKey, withAccount } from "../lib/account-state";
const SESSION_KEY = "gleans:dashboard-demo-session:v1";
export interface DashboardDataProvider { state: DemoState; ready: boolean; storageError: string; dispatch: (action: DemoAction) => void; account?: DashboardUser; demoActive: boolean; enterDemo: () => void; leaveDemo: () => void }
const Context = createContext<DashboardDataProvider | null>(null);
export function DemoDashboardProvider({ children, account }: { children: ReactNode; account?: DashboardUser }) {
  const storageKey = dashboardStorageKey(account);
  const [state, setState] = useState<DemoState>(() => withAccount(initialDemo(), account));
  const [demoActive, setDemoActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    try {
      setDemoActive(localStorage.getItem(SESSION_KEY) === "active");
      const raw = localStorage.getItem(storageKey);
      if (raw) { const result = demoSchema.safeParse(JSON.parse(raw)); if (result.success) setState(upgradeDemoRetention(result.data)); else setStorageError("Data demo tersimpan tidak valid. Data contoh dipulihkan."); }
    } catch { setStorageError("Data demo tidak dapat dipulihkan. Perubahan hanya tersedia selama halaman ini terbuka."); }
    setReady(true);
  }, [storageKey]);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(storageKey, JSON.stringify(state)); }
    catch { setStorageError("Data demo tidak dapat disimpan di browser ini."); }
  }, [state, ready, storageKey]);
  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key === SESSION_KEY) setDemoActive(event.newValue === "active");
      if (event.key === storageKey && event.newValue) {
        try { const parsed = demoSchema.safeParse(JSON.parse(event.newValue)); if (parsed.success) setState(upgradeDemoRetention(parsed.data)); } catch { /* Ignore invalid data from another tab. */ }
      }
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [storageKey]);
  const enterDemo = useCallback(() => {
    setDemoActive(true);
    try { localStorage.setItem(SESSION_KEY, "active"); } catch { /* Keep this demo session in memory. */ }
  }, []);
  const leaveDemo = useCallback(() => {
    setDemoActive(false);
    try { localStorage.removeItem(SESSION_KEY); } catch { /* Keep dashboard data when storage is unavailable. */ }
  }, []);
  const dispatch = useCallback((action: DemoAction) => setState(s => demoReducer(s, action)), []);
  return <Context.Provider value={{ state: withAccount(state, account), account, ready, storageError, dispatch, demoActive, enterDemo, leaveDemo }}>{children}</Context.Provider>;
}
export function useDashboard() { const value = useContext(Context); if (!value) throw new Error("Dashboard provider missing"); return value; }
