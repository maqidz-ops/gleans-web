"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NAV_LINKS, PRODUCTS } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-16 items-center justify-between px-5 md:px-8 lg:h-[68px] lg:px-10">
        <Link href="/" aria-label="Gleans - Beranda" className="shrink-0">
          <Logo className="h-7 lg:h-[34px]" />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger className="group inline-flex items-center gap-2 text-base outline-none">
              Produk
              <ChevronDown className="size-5 transition-transform group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={12} className="w-80 rounded-2xl p-2">
              {PRODUCTS.map((p) => (
                <DropdownMenuItem key={p.href} asChild className="rounded-xl p-3">
                  <Link href={p.href} className="flex items-start gap-3">
                    <Image src={p.icon} alt="" width={32} height={32} className="mt-0.5 size-8 shrink-0" />
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium">
                        {p.name} <span className="text-muted-foreground">· {p.short}</span>
                      </span>
                      <span className="text-muted-foreground text-xs leading-snug">{p.description}</span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-base transition-colors hover:text-primary",
                pathname === l.href && "text-primary",
              )}
            >
              {l.label}
            </Link>
          ))}
          <Button asChild size="pill-sm" className="w-[100px]">
            <Link href="/daftar">Daftar</Link>
          </Button>
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Buka menu">
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="h-dvh w-screen max-w-none gap-0 border-0 p-0 shadow-none data-[side=right]:w-screen data-[side=right]:max-w-none data-[side=right]:sm:max-w-none"
          >
            <SheetHeader className="border-b px-5 py-4 pr-14">
              <SheetTitle>
                <Logo className="h-7" />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col">
              <button
                type="button"
                onClick={() => setProductsOpen((v) => !v)}
                aria-expanded={productsOpen}
                className="flex items-center justify-between border-b px-5 py-5 text-left text-base text-muted-foreground"
              >
                Produk
                <ChevronDown className={cn("size-5 transition-transform", productsOpen && "rotate-180")} />
              </button>
              {productsOpen && (
                <div className="flex flex-col border-b">
                  {PRODUCTS.map((p) => (
                    <Link
                      key={p.href}
                      href={p.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-5 py-4 text-muted-foreground"
                    >
                      <Image src={p.icon} alt="" width={24} height={24} className="size-6 shrink-0" />
                      <span className="text-base">
                        {p.name} <span className="text-muted-foreground">· {p.short}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="border-b px-5 py-5 text-base text-muted-foreground"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 flex gap-3 px-5">
              <Button asChild size="pill" variant="outline" className="flex-1 font-normal" onClick={() => setOpen(false)}>
                <Link href="/masuk">Masuk</Link>
              </Button>
              <Button asChild size="pill" className="flex-1 font-normal" onClick={() => setOpen(false)}>
                <Link href="/daftar">Daftar</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
