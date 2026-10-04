"use client";

import { Plus } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { SectionHeading } from "@/components/layout/section-heading";

const FAQS = [
  {
    q: "Apa itu Gleans?",
    a: "Gleans adalah platform berbasis AI yang membantu proses penulisan akademik secara lebih efisien dan terarah. Mulai dari parafrase, humanize teks AI, cek plagiasi, semuanya tersedia dalam satu sistem terintegrasi.",
  },
  {
    q: "Siapa yang cocok menggunakan Gleans?",
    a: "Mahasiswa D3, S1, S2, maupun S3 yang sedang menyusun tugas, makalah, jurnal, skripsi, atau tesis. Dosen dan peneliti juga bisa memakai Gleans untuk merapikan referensi.",
  },
  {
    q: "Produk apa saja yang tersedia di Gleans?",
    a: "Ada empat: Gleans Shield untuk deteksi tulisan AI, Gleans Writer untuk parafrase kalimat, Gleans Cite untuk membuat sitasi APA 7 dan IEEE dari DOI atau judul karya, dan Gleans File untuk mengelola dokumen akademik. Writer, Cite, dan File masih dalam pengembangan.",
  },
  {
    q: "Bagaimana cara menggunakan Gleans?",
    a: "Untuk deteksi AI, isi nomor WhatsApp, unggah dokumen, lalu bayar lewat QRIS. Hasilnya dikirim melalui WhatsApp dan bisa diunduh di halaman Cek Pesanan. Parafrase dan sitasi bisa langsung dipakai dari halamannya masing-masing.",
  },
  {
    q: "Apakah Dokumen aman?",
    a: "Teks dokumen diekstrak langsung di browser kamu, jadi file aslinya tidak pernah diunggah ke server kami. Laporan hasil deteksi otomatis dihapus 24 jam setelah selesai.",
  },
];

export function Faq() {
  return (
    <section className="section-y">
      <div className="container-page flex flex-col gap-10 md:gap-14 lg:gap-[60px]">
        <SectionHeading
          title="Pertanyaan yang sering diajukan"
          description="Gleans hadir untuk mendukung setiap kebutuhan penulisan akademikmu."
        />
        <AccordionPrimitive.Root type="single" collapsible defaultValue="0" className="flex flex-col gap-4">
          {FAQS.map((f, i) => (
            <AccordionPrimitive.Item
              key={f.q}
              value={String(i)}
              className="group rounded-[24px] border bg-white"
            >
              <AccordionPrimitive.Header>
                <AccordionPrimitive.Trigger className="flex w-full items-center justify-between gap-4 rounded-[24px] p-5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:p-6">
                  <span className="text-lg md:text-xl lg:text-2xl group-data-[state=open]:font-semibold">{f.q}</span>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#fafafa] transition-colors group-data-[state=open]:bg-primary group-data-[state=open]:text-white md:size-12">
                    <Plus className="size-5 transition-transform group-data-[state=open]:rotate-45 md:size-6" />
                  </span>
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <p className="text-muted-foreground px-5 pb-5 text-base md:px-6 md:pb-6 lg:pr-24 lg:text-lg">{f.a}</p>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          ))}
        </AccordionPrimitive.Root>
      </div>
    </section>
  );
}
