"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";

type Props = { className?: string; label: string; value: string; options: readonly { value: string; label: string }[]; onChange: (value: string) => void };

export function FilterDropdown({ label, value, options, onChange, className }: Props) {
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button type="button" aria-label={label} className={cn("inline-flex h-10 w-fit shrink-0 items-center justify-center gap-2 justify-self-end rounded-full border bg-white px-4 text-sm outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/15",className)}>
        <span className="min-w-0 truncate">{options.find(option=>option.value===value)?.label??value}</span><ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground"/>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-2xl border bg-white p-1.5 shadow-lg">
      <DropdownMenuRadioGroup aria-label={label} value={value} onValueChange={onChange}>
        {options.map(option=><DropdownMenuRadioItem key={option.value} value={option.value} className="min-h-11 cursor-pointer rounded-xl pl-3 pr-9 text-sm data-[state=checked]:bg-accent data-[state=checked]:font-medium data-[state=checked]:text-primary focus:bg-accent focus:text-primary">{option.label}</DropdownMenuRadioItem>)}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}
