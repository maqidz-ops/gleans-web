import type { Metadata } from "next";
import Image from "next/image";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { FileWorkspace } from "@/components/file/file-workspace";

export const metadata: Metadata = {
  title: "Gleans File — Kelola Dokumen",
  description:
    "Konversi DOCX, DOC, TXT, PNG dan JPEG ke PDF, gabungkan PDF, serta kompres dokumen langsung di perangkatmu dengan Gleans File.",
};

export default function FilePage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Gleans File" }]} />
      <section className="container-page flex flex-col gap-10 pt-10 pb-16 md:gap-14 md:pt-14 lg:gap-[60px] lg:pt-[60px] lg:pb-20">
        <header className="flex flex-col gap-3">
          <p className="text-primary flex items-center gap-2 text-sm font-medium tracking-wide">
            <Image src="/images/logo-gleans-file.svg" alt="" width={20} height={20} className="size-5" />
            GLEANS FILE
          </p>
          <h1 className="text-[32px] leading-tight font-medium tracking-tight md:text-[40px] lg:text-[48px]">
            Kelola dokumenmu lebih mudah
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Gleans hadir untuk mendukung setiap kebutuhan penulisan akademikmu.
          </p>
        </header>
        <FileWorkspace />
      </section>
    </>
  );
}
