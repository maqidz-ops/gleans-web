import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { OrderLookup } from "@/components/orders/order-lookup";

export const metadata: Metadata = {
  title: "Cek Pesanan",
  description: "Cari pesanan Gleans dengan nomor invoice atau nomor WhatsApp.",
};

export default function CekPesananPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Cek Pesanan" }]} />
      <OrderLookup />
    </>
  );
}
