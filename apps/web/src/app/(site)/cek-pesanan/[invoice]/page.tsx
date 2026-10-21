import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { OrderDetail } from "@/features/orders/components/order-detail";

export const metadata: Metadata = { title: "Detail Pesanan", robots: { index: false, follow: false } };

export default async function OrderDetailPage({ params }: { params: Promise<{ invoice: string }> }) {
  const { invoice } = await params;
  return <><Breadcrumb items={[{ label: "Cek Pesanan", href: "/cek-pesanan" }, { label: "Detail Pesanan" }]} /><OrderDetail invoice={invoice} /></>;
}
