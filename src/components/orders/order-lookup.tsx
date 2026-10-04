"use client";

import Image from "next/image";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OrderLookup() {
  const [query, setQuery] = useState("");

  return (
    <section className="container-page flex flex-1 flex-col pt-8 pb-16 md:pt-12 lg:pt-16">
      <form
        className="bg-surface mx-auto flex h-14 w-full max-w-[720px] items-center gap-2 rounded-full pr-1 pl-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <Search className="text-muted-foreground size-5 shrink-0" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Masukkan No. WhatsApp atau kode"
          aria-label="No. WhatsApp atau kode pesanan"
          className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none md:text-base"
        />
        <Button type="submit" size="pill-sm" className="shrink-0 px-4 font-normal sm:px-5">
          Cari
        </Button>
      </form>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <Image
          src="/images/empty-order.png"
          alt=""
          width={92}
          height={88}
          className="h-auto w-[80px]"
        />
        <div className="flex max-w-md flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">Tidak ada pesanan</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Riwayat pesananmu akan tampil di sini setelah kamu melakukan pemesanan.
          </p>
        </div>
      </div>
    </section>
  );
}
