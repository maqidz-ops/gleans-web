import type { Metadata } from "next";
import { FileWorkspace } from "@/components/file/file-workspace";

export const metadata: Metadata = {
  title: "Gleans File — Kelola Dokumen",
  description:
    "Siapkan dokumen akademikmu di Gleans File. Pilih file dan jelajahi alat convert, merge, dan compress dalam satu tempat.",
};

export default function FilePage() {
  return (
    <section className="container-page flex flex-col gap-10 pt-10 pb-16 md:gap-14 md:pt-14 lg:gap-[60px] lg:pt-[60px] lg:pb-20">
      <header className="flex flex-col gap-3">
        <h1 className="text-[32px] leading-tight font-medium tracking-tight md:text-[40px] lg:text-[48px]">
          Kelola dokumenmu lebih mudah
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Gleans hadir untuk mendukung setiap kebutuhan penulisan akademikmu.
        </p>
      </header>
      <FileWorkspace />
    </section>
  );
}
