import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ASSETS } from "@/lib/assets";

export function CtaBanner() {
  return (
    <section className="section-y">
      <div className="container-page">
        <div className="flex flex-col-reverse items-center gap-8 overflow-hidden rounded-[24px] bg-navy px-6 py-10 text-center md:px-10 md:py-12 lg:flex-row lg:justify-between lg:gap-8 lg:px-[60px] lg:py-[42px] lg:text-left">
          <div className="flex max-w-[620px] flex-col items-center gap-6 lg:items-start">
            <h2 className="text-[36px] leading-[1.15] font-medium text-white md:text-5xl lg:text-[64px] lg:leading-[1.2]">
              Yuk, Mulai Cek Dokumenmu!
            </h2>
            <Button asChild variant="white" size="pill" className="w-full font-medium sm:w-[180px]">
              <Link href="/deteksi-ai">Mulai Sekarang</Link>
            </Button>
          </div>
          <Image
            src={ASSETS.illustration}
            alt=""
            width={420}
            height={315}
            className="h-auto w-[240px] md:w-[320px] lg:w-[420px]"
          />
        </div>
      </div>
    </section>
  );
}
