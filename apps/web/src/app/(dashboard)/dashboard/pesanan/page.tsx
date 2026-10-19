import { Suspense } from "react";
import { SandboxPaymentOrders } from "@/features/payments/components/order-list";
import { DashboardOrders } from "@/features/dashboard/components/orders";
export default function Page() { return <Suspense fallback={<p>Memuat pesanan…</p>}><><SandboxPaymentOrders /><DashboardOrders /></></Suspense>; }
