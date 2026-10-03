import Image from "next/image";
import { SectionHeading } from "@/components/layout/section-heading";

const TESTIMONIALS = [
  {
    name: "Salsabila Putri",
    avatar: "/images/profile-salsabila.png",
    campus: "Universitas Negeri Yogyakarta",
    quote:
      "Sejak menggunakan Gleans, saya jadi lebih percaya diri sebelum mengumpulkan tugas. Proses pengecekan dan persiapan tulisan terasa jadi lebih cepat dan saya bisa lebih tenang saat submit tugas.",
  },
  {
    name: "Fahri Maulana",
    avatar: "/images/profile-fahri.png",
    campus: "Universitas Muhammadiyah Malang",
    quote:
      "Gleans membantu saya dari proses menyusun sampai mengecek tulisan. Simple, cepat, dan sangat membantu terutama saat deadline tugas sudah dekat. Semua yang saya butuhkan ada dalam satu platform.",
  },
  {
    name: "Putra Ramadhan",
    avatar: "/images/profile-putra.png",
    campus: "Universitas Negeri Semarang",
    quote:
      "Gleans membantu saya menyelesaikan kebutuhan penulisan akademik dalam satu tempat. Dari menyusun tulisan sampai mengeceknya sebelum dikumpulkan, semuanya terasa lebih praktis, cepat, dan nggak ribet.",
  },
];

function TestimonialCard({
  name,
  avatar,
  campus,
  quote,
  className,
  hidden,
}: {
  name: string;
  avatar: string;
  campus: string;
  quote: string;
  className?: string;
  hidden?: boolean;
}) {
  return (
    <figure className={className} aria-hidden={hidden}>
      <div className="flex flex-col gap-6">
        <Image src="/images/icon-quote.png" alt="" width={20} height={20} className="size-5" />
        <blockquote className="text-lg leading-relaxed md:text-xl lg:text-2xl lg:leading-[1.5]">{quote}</blockquote>
      </div>
      <figcaption className="flex items-center gap-4">
        <Image
          src={avatar}
          alt=""
          width={72}
          height={72}
          className="size-14 shrink-0 rounded-2xl object-cover md:size-[72px]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1 md:gap-2">
          <p className="truncate text-lg font-semibold md:text-[22px]">{name}</p>
          <p className="text-muted-foreground truncate text-sm md:text-base">{campus}</p>
        </div>
        <span className="flex items-center gap-2 text-lg md:text-xl">
          <Image src="/images/icon-star.png" alt="" width={20} height={20} className="size-5" />
          5.0
        </span>
      </figcaption>
    </figure>
  );
}

const cardClass =
  "flex flex-col justify-between gap-8 rounded-[24px] bg-white p-5 md:p-6 lg:min-h-[400px]";

export function Testimonials() {
  const cards = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section className="section-y bg-surface overflow-hidden">
      <div className="flex flex-col gap-10 md:gap-14 lg:gap-20">
        <div className="container-page">
          <SectionHeading
            title="Kata mereka tentang Gleans"
            description="Gleans hadir untuk mendukung setiap kebutuhan penulisan akademikmu."
          />
        </div>
        <div className="container-page flex flex-col gap-4 md:hidden">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} {...t} className={cardClass} />
          ))}
        </div>
        <div className="hidden overflow-hidden motion-reduce:overflow-x-auto md:block">
          <div className="flex w-max animate-marquee gap-4 hover:[animation-play-state:paused] motion-reduce:animate-none lg:gap-6">
            {cards.map((t, i) => (
              <TestimonialCard
                key={`${t.name}-${i}`}
                {...t}
                hidden={i >= TESTIMONIALS.length}
                className={`${cardClass} w-[min(88vw,600px)] shrink-0`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
