"use client";

import { useCallback, useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      window.localStorage.removeItem(key);
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value, hydrated]);

  const update = useCallback((next: T | ((prev: T) => T)) => setValue(next), []);

  return [value, update, hydrated] as const;
}
