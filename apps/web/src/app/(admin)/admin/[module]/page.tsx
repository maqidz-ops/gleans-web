import { Suspense } from "react";
import { notFound } from "next/navigation";
import { modules } from "@/features/admin/lib/model";
import { AdminModule } from "@/features/admin/components/module";
export function generateStaticParams(){return modules.map(module=>({module}));}
export default async function Page({params}:{params:Promise<{module:string}>}){const {module}=await params;if(!modules.includes(module as typeof modules[number]))notFound();return <Suspense fallback={<p>Memuat halaman admin…</p>}><AdminModule module={module as typeof modules[number]}/></Suspense>;}
