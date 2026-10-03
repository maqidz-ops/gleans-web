import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { CtaBanner } from "@/components/layout/cta-banner";
import { PageIntro } from "@/components/layout/section-heading";
import { LegalDocument } from "@/components/legal/legal-document";
import { PRIVACY_POLICY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Cara Gleans mengumpulkan, menggunakan, menyimpan, dan menghapus data serta dokumen penggunanya.",
};

export default function KebijakanPrivasiPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Kebijakan Privasi" }]} />
      <section className="container-page flex flex-col gap-10 pt-10 pb-16 md:pt-14 lg:gap-12 lg:pt-[60px] lg:pb-24">
        <PageIntro
          title="Kebijakan Privasi"
          description="Penjelasan tentang data yang kami kumpulkan dan cara kami menjaganya."
        />
        <LegalDocument sections={PRIVACY_POLICY} />
      </section>
      <CtaBanner />
    </>
  );
}
