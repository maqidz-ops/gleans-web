import Image from "next/image";
import { SectionHeading } from "@/components/layout/section-heading";

const ITEMS = [
  {
    icon: "/images/icon-verify.png",
    title: "Platform Resmi",
    body: "Menggunakan sistem kredibel yang teruji dan diakui standar universitas tanpa biaya lisensi mahal.",
  },
  {
    icon: "/images/icon-tag.png",
    title: "Murah & Cepat",
    body: "Sistem otomatisasi memastikan analisis dan pemrosesan dokumen selesai secara presisi dalam hitungan menit.",
  },
  {
    icon: "/images/icon-shield.png",
    title: "Keamanan Data",
    body: "Dokumen dihapus secara otomatis dari sistem setelah pemrosesan selesai untuk menjamin kerahasiaan dokumen.",
  },
];

export function Advantages() {
  return (
    <section className="section-y">
      <div className="container-page flex flex-col gap-10 md:gap-14 lg:gap-20">
        <SectionHeading
          title="Kenapa memilih Gleans?"
          description="Gleans hadir untuk mendukung setiap kebutuhan penulisan akademikmu."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map(({ icon, title, body }, i) => (
            <div
              key={title}
              className={`flex flex-col gap-8 rounded-[24px] border bg-white p-4 md:min-h-[240px] lg:min-h-[260px] ${
                i === 2 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <span className="flex size-12 items-center justify-center rounded-[16px] bg-primary">
                <Image src={icon} alt="" width={24} height={24} className="size-6" />
              </span>
              <div className="mt-auto flex flex-col gap-3">
                <h3 className="text-2xl font-medium">{title}</h3>
                <p className="text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
