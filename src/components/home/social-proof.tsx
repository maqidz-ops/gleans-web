import Image from "next/image";
import { GraduationCap } from "lucide-react";
import { ASSETS, UNIVERSITIES } from "@/lib/assets";

export function SocialProof() {
  return (
    <section className="flex flex-col gap-[22px]">
      <p className="container-page text-center text-sm md:text-base">
        Gleans telah dipercaya oleh 50.000+ mahasiswa di seluruh Indonesia.
      </p>
      <div className="bg-surface overflow-hidden py-5 md:py-6">
        {ASSETS.socialProofStrip ? (
          <Image
            src={ASSETS.socialProofStrip}
            alt="Kampus pengguna Gleans"
            width={1280}
            height={83}
            className="mx-auto h-auto w-full max-w-[1280px]"
          />
        ) : (
          <div className="group flex w-max animate-marquee gap-12 hover:[animation-play-state:paused] motion-reduce:animate-none">
            {[...UNIVERSITIES, ...UNIVERSITIES].map((name, i) => (
              <span
                key={`${name}-${i}`}
                aria-hidden={i >= UNIVERSITIES.length}
                className="flex items-center gap-2 text-sm font-semibold whitespace-nowrap text-[#6b6f76] grayscale md:text-base"
              >
                <GraduationCap className="size-6 text-[#9a9ea5]" />
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
