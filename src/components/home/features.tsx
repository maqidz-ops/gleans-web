import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FeatureMark } from "@/components/brand/logo";
import { SectionHeading } from "@/components/layout/section-heading";
import { PRODUCTS } from "@/lib/site";

export function Features() {
  return (
    <section id="fitur" className="section-y">
      <div className="container-page flex flex-col gap-10 md:gap-14 lg:gap-20">
        <SectionHeading
          title="Satu platform, tiga solusi"
          description="Gleans hadir untuk mendukung setiap kebutuhan penulisan akademikmu."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p, i) => (
            <Link
              key={p.href}
              href={p.href}
              className={`group flex min-h-[240px] flex-col justify-between gap-8 rounded-[24px] border bg-white p-4 transition-shadow hover:shadow-[0_12px_32px_-12px_rgba(33,41,220,0.25)] md:min-h-[280px] lg:min-h-[320px] ${
                i === 2 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <FeatureMark />
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <h3 className="text-xl font-bold">{p.tag}</h3>
                  <p className="text-muted-foreground">{p.description}</p>
                </div>
                <span className="flex size-9 items-center justify-center self-end rounded-full bg-primary text-white transition-transform group-hover:translate-x-1">
                  <ArrowRight className="size-5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
