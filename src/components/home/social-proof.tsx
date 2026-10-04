import Image from "next/image";

const LOGOS = [
  { src: "/images/logo-unnes.png", alt: "Universitas Negeri Semarang", width: 955, height: 293, className: "h-9 w-[148px] md:h-11 md:w-[190px]" },
  { src: "/images/logo-amikom.png", alt: "Universitas Amikom Yogyakarta", width: 1024, height: 372, className: "h-9 w-[148px] md:h-11 md:w-[190px]" },
  { src: "/images/logo-dinamika.png", alt: "Universitas Dinamika", width: 880, height: 245, className: "h-9 w-[148px] md:h-11 md:w-[190px]" },
  { src: "/images/logo-pertamina.png", alt: "Universitas Pertamina", width: 1024, height: 742, className: "h-24 w-[124px] md:h-[120px] md:w-[168px]" },
  { src: "/images/logo-cakrawala.png", alt: "Cakrawala University", width: 242, height: 66, className: "h-9 w-[148px] md:h-11 md:w-[190px]" },
  { src: "/images/logo-telkom.png", alt: "Telkom University", width: 420, height: 571, className: "h-24 w-[72px] md:h-[132px] md:w-[100px]" },
  { src: "/images/logo-undip.png", alt: "Universitas Diponegoro", width: 880, height: 1024, className: "h-16 w-14 md:h-20 md:w-[72px]" },
  { src: "/images/logo-esa-unggul.png", alt: "Universitas Esa Unggul", width: 784, height: 831, className: "h-24 w-[108px] md:h-[120px] md:w-[144px]" },
] as const;

export function SocialProof() {
  const logos = [...LOGOS, ...LOGOS];

  return (
    <section className="flex flex-col gap-[22px]">
      <p className="container-page text-center text-sm md:text-base">
        Gleans telah dipercaya oleh 50.000+ mahasiswa di seluruh Indonesia.
      </p>
      <div className="overflow-hidden bg-white py-6 motion-reduce:overflow-x-auto md:py-8">
        <ul className="flex w-max items-center gap-12 animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none">
          {logos.map((logo, i) => (
            <li
              key={`${logo.src}-${i}`}
              aria-hidden={i >= LOGOS.length}
              className={`flex shrink-0 items-center justify-center ${logo.className}`}
            >
              <Image
                src={logo.src}
                alt={i >= LOGOS.length ? "" : logo.alt}
                width={logo.width}
                height={logo.height}
                className="h-full w-full object-contain grayscale"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
