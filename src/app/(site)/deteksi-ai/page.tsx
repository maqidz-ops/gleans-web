import type { Metadata } from "next";
import { OrderForm } from "@/components/detection/order-form";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { CtaBanner } from "@/components/layout/cta-banner";
import { PageIntro } from "@/components/layout/section-heading";
import { ToolHighlights } from "@/components/layout/tool-highlights";
import { PRODUCTS } from "@/lib/site";

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
          badge={{ icon: PRODUCTS[0].icon, label: PRODUCTS[0].tag }}
          title="Cek Deteksi AI & Plagiarisme"
          description="Unggah dokumenmu, bayar sekali, dan laporan hasil pemeriksaan dikirim langsung ke WhatsApp."
        />
        <OrderForm />
      </section>
      <ToolHighlights
        title="Alur pemesanan"
        description="Tiga langkah, dari unggah dokumen sampai laporan masuk ke WhatsApp."
        items={[
          {
            step: "1",
            title: "Unggah dokumen",
            body: "Isi nomor WhatsApp, lalu unggah file PDF, DOC, DOCX, atau TXT. Sistem menghitung jumlah kata sebelum kamu membayar.",
          },
          {
            step: "2",
            title: "Bayar sekali",
            body: "Cek nama file, ukuran, dan jumlah kata di ringkasan pesanan. Pakai kode promo jika ada, lalu selesaikan pembayaran.",
          },
          {
            step: "3",
            title: "Terima laporan",
            body: "Hasil deteksi AI dan plagiarisme dikirim ke WhatsApp yang kamu isi, biasanya dalam beberapa menit.",
          },
        ]}
      />
      <CtaBanner />
    </>
  );
}
