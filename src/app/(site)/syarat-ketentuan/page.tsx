import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { CtaBanner } from "@/components/layout/cta-banner";
import { PageIntro } from "@/components/layout/section-heading";
import { LegalDocument } from "@/components/legal/legal-document";
import { TERMS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: "Ketentuan penggunaan layanan Gleans, mulai dari ruang lingkup layanan, pembayaran, sampai batasan tanggung jawab.",
};

export default function SyaratKetentuanPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Syarat & Ketentuan" }]} />
      <section className="container-page flex flex-col gap-10 pt-10 pb-16 md:pt-14 lg:gap-12 lg:pt-[60px] lg:pb-24">
        <PageIntro
          title="Syarat & Ketentuan"
          description="Hal-hal yang perlu kamu ketahui sebelum menggunakan layanan Gleans."
        />
        <LegalDocument sections={TERMS} />
      </section>
      <CtaBanner />
    </>
  );
}
