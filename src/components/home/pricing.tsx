import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { FeatureMark } from "@/components/brand/logo";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

const PLANS = [
  { id: "starter", name: "Starter", price: 45_000, normal: 85_000, checks: 5, blurb: "Pas untuk tugas kuliah dan makalah rutin." },
  { id: "standart", name: "Standart", price: 85_000, normal: 165_000, checks: 10, blurb: "Untuk proposal, laporan, dan tugas yang lebih panjang." },
  { id: "premium", name: "Premium", price: 165_000, normal: 250_000, checks: 25, blurb: "Hemat untuk skripsi, tesis, dan kelompok." },
];

export function Pricing() {
  return (
    <section id="harga" className="section-y scroll-mt-16">
      <div className="container-page flex flex-col gap-10 md:gap-14 lg:gap-20">
        <SectionHeading
          title="Pilih paket sesuai kebutuhanmu"
          description="Gleans hadir untuk mendukung setiap kebutuhan penulisan akademikmu."
        />
        <div className="flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <article
              key={plan.id}
              className={cn(
                "flex w-full flex-col justify-between gap-10 rounded-[24px] border bg-white p-4 md:w-auto lg:min-h-[475px] lg:gap-[59px]",
                i === 2 && "md:col-span-2 lg:col-span-1",
              )}
            >
              <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between gap-8">
                  <FeatureMark />
                  <div className="flex flex-col items-end gap-1 text-right">
                    <p className="text-2xl font-semibold">{formatRupiah(plan.price)}</p>
                    <p className="text-muted-foreground line-through">{formatRupiah(plan.normal)}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-[22px] font-semibold">{plan.name}</h3>
                    <p>{plan.blurb}</p>
                  </div>
                  <ul className="flex flex-col gap-3">
                    {[`${plan.checks}x Cek Plagiarisme`, "Dapatkan prioritas pelayanan", "Notifikasi Whatsapp"].map(
                      (f) => (
                        <li key={f} className="flex items-center gap-2">
                          <CircleCheck className="size-6 shrink-0 fill-primary text-white" />
                          {f}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
              <Button asChild size="pill" className="w-full font-normal">
                <Link href={`/daftar?paket=${plan.id}`}>Bayar Sekarang</Link>
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
