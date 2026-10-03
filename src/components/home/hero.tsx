import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ASSETS } from "@/lib/assets";

export function Hero() {
  return (
    <section className="container-page flex flex-col items-center gap-10 pt-12 pb-14 md:pt-16 md:pb-20 lg:min-h-[600px] lg:flex-row lg:justify-between lg:gap-4 lg:py-20">
      <div className="flex w-full max-w-[681px] flex-col items-center gap-6 text-center lg:items-start lg:text-left">
        <div className="flex flex-col items-center gap-4 lg:items-start">
          <p className="flex items-center gap-2 text-sm tracking-wide uppercase">
            <Image src="/images/cup.png" alt="" width={20} height={20} className="size-5" />
            All in one student platform
          </p>
          <h1 className="text-[40px] leading-[1.15] font-medium tracking-tight md:text-5xl lg:text-[68px] lg:leading-[1.2]">
            Partner Penulisan <br className="hidden sm:block" />
            Akademik Mahasiswa
          </h1>
          <p className="text-muted-foreground max-w-[625px] text-base leading-5">
            Mulai dari cek plagiarisme, parafrase, dan penyusunan sitasi serba cepat.
          </p>
        </div>
        <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
          <Button asChild size="pill" className="w-full font-medium lg:w-[180px]">
            <Link href="/deteksi-ai">Yuk, Cek Sekarang</Link>
          </Button>
          <Button asChild variant="outline" size="pill" className="w-full font-medium sm:hidden">
            <Link href="/daftar">Daftar Sekarang</Link>
          </Button>
        </div>
      </div>
      <Image
        src={ASSETS.illustration}
        alt="Ilustrasi Gleans: dokumen, sitasi, dan parafrase dalam satu platform"
        width={460}
        height={345}
        priority
        className="h-auto w-full max-w-[340px] md:max-w-[420px] lg:w-[460px] lg:max-w-none"
      />
    </section>
  );
}
