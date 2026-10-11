import { Suspense } from "react";
import { DashboardOrders } from "@/features/dashboard/components/orders";
export default function Page() { return <Suspense fallback={<p>Memuat pesanan…</p>}><DashboardOrders /></Suspense>; }
