import type { Metadata } from "next";
import { OrderForm } from "@/components/detection/order-form";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { CtaBanner } from "@/components/layout/cta-banner";
import { PageIntro } from "@/components/layout/section-heading";
import { ToolHighlights } from "@/components/layout/tool-highlights";

export const metadata: Metadata = {
  title: "Cek Deteksi AI & Plagiarisme",
  description:
    "Unggah karya ilmiah atau esaimu dan dapatkan laporan deteksi AI serta plagiarisme lewat WhatsApp dalam hitungan menit.",
};

export default function DeteksiAiPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Gleans Shield" }]} />
      <section className="container-page flex flex-col gap-10 pt-10 pb-16 md:pt-14 lg:gap-12 lg:pt-[60px] lg:pb-24">
        <PageIntro
          title="Cek Deteksi AI & Plagiarisme"
          description="Unggah dokumenmu, bayar sekali, dan laporan hasil pemeriksaan dikirim langsung ke WhatsApp."
        />
        <OrderForm />
      </section>
      <ToolHighlights
        title="Periksa dokumen tanpa drama"
        items={[
          {
            title: "Platform Resmi",
            body: "Cek plagiasi menggunakan platform yang kredibel dan sudah dipakai luas oleh universitas.",
          },
          {
            title: "Akses 24 Jam",
            body: "Mau cek tengah malam atau mepet deadline? Tetap bisa langsung jalan otomatis.",
          },
          {
            title: "Proses Mudah & Cepat",
            body: "Dokumen diproses otomatis dan hasilnya bisa kamu terima hanya dalam beberapa menit saja.",
          },
        ]}
      />
      <CtaBanner />
    </>
  );
}
