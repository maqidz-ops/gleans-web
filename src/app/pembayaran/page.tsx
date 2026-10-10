import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { PaymentCheckout } from "@/components/payment/checkout";

export const metadata: Metadata = { title: "Pembayaran Gleans Shield" };

export default function PaymentPage() {
  return <div className="flex min-h-dvh flex-col bg-white">
    <Navbar />
    <Breadcrumb items={[{ label: "Gleans Shield", href: "/deteksi-ai" }, { label: "Pembayaran" }]} />
    <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-12">
      <PaymentCheckout />
    </main>
  </div>;
}
