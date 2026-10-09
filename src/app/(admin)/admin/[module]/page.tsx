import { Suspense } from "react";
import { notFound } from "next/navigation";
import { modules } from "@/lib/admin/model";
import { AdminModule } from "@/components/admin/module";
export function generateStaticParams(){return modules.map(module=>({module}));}
export default async function Page({params}:{params:Promise<{module:string}>}){const {module}=await params;if(!modules.includes(module as typeof modules[number]))notFound();return <Suspense fallback={<p>Memuat halaman admin…</p>}><AdminModule module={module as typeof modules[number]}/></Suspense>;}
