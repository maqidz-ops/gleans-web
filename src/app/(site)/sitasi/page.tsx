import type { Metadata } from "next";
import Image from "next/image";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { CiteWorkspace } from "@/components/citation/cite-workspace";

export const metadata: Metadata = {
  title: "Gleans Cite — Susun Daftar Pustaka",
  description: "Cari referensi lewat judul atau DOI, buat sitasi APA 7, IEEE dan Vancouver, serta unduh daftar pustaka.",
};

export default function SitasiPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Gleans Cite" }]} />
      <section className="container-page flex flex-col gap-10 pt-10 pb-16 md:gap-12 md:pt-14 lg:pb-24">
        <header className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-sm font-medium tracking-wide text-primary"><Image src="/images/logo-gleans-cite.svg" alt="" width={20} height={20} />GLEANS CITE</p>
          <h1 className="text-[32px] font-medium leading-tight tracking-tight md:text-[40px] lg:text-[48px]">Sumber terpercaya, sitasi tertata.</h1>
          <p className="text-base leading-relaxed text-muted-foreground">Dari referensi pertama sampai daftar pustaka terakhir, susun lebih mudah bersama Gleans.</p>
        </header>
        <CiteWorkspace />
      </section>
    </>
  );
}
