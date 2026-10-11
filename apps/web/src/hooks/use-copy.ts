"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function useCopy(resetMs = 1800) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string, key = "default") => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopiedKey(null), resetMs);
        toast.success("Disalin ke clipboard.");
      } catch {
        toast.error("Gagal menyalin. Salin secara manual.");
      }
    },
    [resetMs],
  );

  return { copy, copiedKey };
}
