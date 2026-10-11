"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@gleans/ui/sonner";
import { DemoDashboardProvider } from "@/features/dashboard/components/provider";
import { TooltipProvider } from "@gleans/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <DemoDashboardProvider>{children}</DemoDashboardProvider>
        <Toaster theme="light" position="top-center" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
