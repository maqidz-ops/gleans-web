"use client";

import { AuthNav } from "@/components/auth/auth-nav";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_LINKS, PRODUCTS } from "@/lib/site";
import { cn } from "@/lib/utils";

function SoonBadge() {
  return (
    <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold tracking-wide">
      SOON
    </span>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [soonName, setSoonName] = useState<string | null>(null);
  const [soonOpen, setSoonOpen] = useState(false);

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
              {PRODUCTS.map((p) =>
                p.soon ? (
                  <DropdownMenuItem
                    key={p.href}
                    className="rounded-xl p-3"
                    onSelect={() => {
                      setSoonName(p.name);
                      setSoonOpen(true);
                    }}
                  >
                    <span className="flex w-full items-start gap-3">
                      <Image src={p.icon} alt="" width={32} height={32} className="mt-0.5 size-8 shrink-0" />
                      <span className="flex flex-col gap-0.5">
                        <span className="flex flex-wrap items-center gap-2 font-medium">
                          {p.name} <span className="text-muted-foreground font-normal">· {p.short}</span>
                          <SoonBadge />
                        </span>
                        <span className="text-muted-foreground text-xs leading-snug">{p.description}</span>
                      </span>
                    </span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem key={p.href} asChild className="rounded-xl p-3">
                    <Link href={p.href} className="flex items-start gap-3">
                      <Image src={p.icon} alt="" width={32} height={32} className="mt-0.5 size-8 shrink-0" />
                      <span className="flex flex-col gap-0.5">
                        <span className="font-medium">
                          {p.name} <span className="text-muted-foreground font-normal">· {p.short}</span>
                        </span>
                        <span className="text-muted-foreground text-xs leading-snug">{p.description}</span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-base transition-colors hover:text-primary">
              {l.label}
            </Link>
          ))}
          <AuthNav />
        </nav>

        <Button
          variant="ghost"
          size="icon-lg"
          className="lg:hidden"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          onClick={() => {
            setOpen((value) => !value);
            setProductsOpen(false);
          }}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </Button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full border-t bg-white lg:hidden">
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
                {PRODUCTS.map((p) =>
                  p.soon ? (
                    <button
                      key={p.href}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        setSoonName(p.name);
                        setSoonOpen(true);
                      }}
                      className="flex items-center gap-3 px-5 py-4 text-left text-base text-muted-foreground"
                    >
                      <Image src={p.icon} alt="" width={32} height={32} className="size-8 shrink-0" />
                      <span className="flex flex-wrap items-center gap-2">
                        {p.name} <span>· {p.short}</span>
                        <SoonBadge />
                      </span>
                    </button>
                  ) : (
                    <Link
                      key={p.href}
                      href={p.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-5 py-4 text-muted-foreground"
                    >
                      <Image src={p.icon} alt="" width={32} height={32} className="size-8 shrink-0" />
                      <span className="text-base">
                        {p.name} <span className="text-muted-foreground">· {p.short}</span>
                      </span>
                    </Link>
                  ),
                )}
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
          <div className="mt-6 flex gap-3 px-5 pb-6">
            <AuthNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <Dialog open={soonOpen} onOpenChange={setSoonOpen}>
        <DialogContent className="rounded-[24px] p-6 sm:max-w-[400px]">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-xl font-semibold">{soonName} masih dalam pengembangan</DialogTitle>
            <DialogDescription className="text-base">
              Produk ini sedang kami kerjakan dan akan segera tersedia.
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full font-normal" onClick={() => setSoonOpen(false)}>
            Mengerti
          </Button>
        </DialogContent>
      </Dialog>
    </header>
  );
}
