import { Suspense } from "react";
import { DashboardOrders } from "@/components/dashboard/orders";
export default function Page() { return <Suspense fallback={<p>Memuat pesanan…</p>}><DashboardOrders /></Suspense>; }
