"use client";

import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDashboard } from "./provider";

export function AccountMenu({ compact = false }: { compact?: boolean }) {
  const { state, leaveDemo } = useDashboard();
  const name = state.profile.name;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label={`Menu akun ${name}`} className="h-11 min-w-0 gap-2 rounded-full border border-border bg-white px-2 sm:px-3">
          <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent font-medium text-primary">{name[0].toUpperCase()}</span>
          {!compact && <span title={name} className="hidden max-w-48 truncate sm:inline">{name}</span>}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-2xl p-2">
        <DropdownMenuLabel className="px-3 py-2"><p className="break-words text-sm font-medium">{name}</p><p className="mt-1 text-xs font-normal text-muted-foreground">Akun demo</p></DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5"><Link href="/dashboard"><LayoutDashboard />Dashboard</Link></DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5"><Link href="/dashboard/pengaturan"><Settings />Pengaturan akun</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5"><Link href="/masuk" onClick={leaveDemo}><LogOut />Keluar demo</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
