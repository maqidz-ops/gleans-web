import type { Metadata } from "next";
import { CiteGenerator } from "@/components/citation/cite-generator";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { CtaBanner } from "@/components/layout/cta-banner";
import { PageIntro } from "@/components/layout/section-heading";
import { ToolHighlights } from "@/components/layout/tool-highlights";

export const metadata: Metadata = {
  title: "Cite Generator APA 7 & IEEE",
  description: "Buat sitasi APA 7 dan IEEE otomatis dari DOI atau judul karya ilmiah. Gratis dan langsung bisa disalin.",
};

export default function SitasiPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Gleans Cite" }]} />
      <section className="container-page flex flex-col gap-10 pt-10 pb-16 md:pt-14 lg:gap-12 lg:pt-[60px] lg:pb-24">
        <PageIntro
          title="Cite Generator"
          description="Buat sitasi APA 7 dan IEEE dari DOI atau judul karya dalam hitungan detik."
        />
        <CiteGenerator />
      </section>
      <ToolHighlights
        title="Sitasi rapi tanpa ketik manual"
        items={[
          {
            title: "Data dari Crossref",
            body: "Metadata diambil dari Crossref dan OpenAlex, basis data jutaan artikel ilmiah.",
          },
          {
            title: "APA 7 & IEEE",
            body: "Berpindah gaya sitasi dengan satu klik, lengkap dengan kutipan dalam teks.",
          },
          {
            title: "Tersimpan di perangkatmu",
            body: "Daftar pustaka disimpan di browser, jadi tidak hilang saat halaman dimuat ulang.",
          },
        ]}
      />
      <CtaBanner />
    </>
  );
}
