"use client";

import { useEffect, useState } from "react";
import { AdminFilterDropdown } from "./filter-dropdown";
import { formatRupiah } from "@/lib/format";
import { summaryDemoHistory } from "@/lib/admin/summary-demo";

type Point = { date: string; label: string; value: number };
const shortMoney = (value: number) => value >= 1000000 ? `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value / 1000000)} jt` : value >= 1000 ? `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value / 1000)} rb` : String(value);

export function AdminSummaryCharts() {
  const [days, setDays] = useState(7);
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const part = (type: string) => parts.find(p => p.type === type)?.value;
    setToday(`${part("year")}-${part("month")}-${part("day")}`);
  }, []);
  if (!today) return <div className="mt-7 h-80 rounded-[24px] bg-surface" aria-label="Memuat grafik"/>;
  const dates = Array.from({ length: days }, (_, i) => {
    const day = new Date(`${today}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() - days + 1 + i);
    return { date: day.toISOString().slice(0, 10), label: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }).format(day).toUpperCase() };
  });
  const history = summaryDemoHistory(today);
  const income = dates.map(d => ({ ...d, value: history.find(p => p.date === d.date)?.income || 0 }));
  const orders = dates.map(d => ({ ...d, value: history.find(p => p.date === d.date)?.orders || 0 }));
  return <section className="mt-7" aria-label="Grafik pendapatan dan pesanan">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Tren {days} hari terakhir</h2><div className="ml-auto flex flex-wrap items-center justify-end gap-3"><AdminFilterDropdown label={`Periode grafik: ${days} hari`} value={`${days} hari`} options={["7 hari","14 hari","30 hari"]} onChange={value=>setDays(parseInt(value,10))}/></div></div>
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <BarChart title="TOTAL PENDAPATAN" points={income} money/>
      <BarChart title="TOTAL PESANAN" points={orders}/>
    </div>
  </section>;
}

function BarChart({ title, points, money = false }: { title: string; points: Point[]; money?: boolean }) {
  const total = points.reduce((sum, p) => sum + p.value, 0);
  const maximum = Math.max(...points.map(p => p.value), money ? 1000 : 1);
  const step = money ? 10 ** Math.floor(Math.log10(maximum)) : 1;
  const ceiling = money ? Math.ceil(maximum / step) * step : Math.max(2, Math.ceil(maximum / 2) * 2);
  const format = (value: number) => money ? formatRupiah(value) : `${value} pesanan`;
  return <article className="min-w-0 rounded-[24px] border bg-white p-4 sm:p-5">
    <p className="text-2xl font-semibold">{money ? formatRupiah(total) : new Intl.NumberFormat("id-ID").format(total)}</p><h3 className="mt-2 text-xs font-medium text-muted-foreground">{title}</h3>
    <div className="mt-6 overflow-x-auto pb-2" role="region" aria-label={`Grafik ${title}`} tabIndex={points.length > 7 ? 0 : undefined}><div className="flex gap-2" style={{ minWidth: points.length > 7 ? points.length * 48 + 48 : undefined }} role="group" aria-label={title}>
      <div aria-hidden="true" className="flex h-44 w-10 shrink-0 flex-col justify-between text-[10px] text-muted-foreground"><span>{money ? shortMoney(ceiling) : ceiling}</span><span>{money ? shortMoney(ceiling / 2) : Math.floor(ceiling / 2)}</span><span>0</span></div>
      <div className="relative grid min-w-0 flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 flex h-44 flex-col justify-between"><div className="border-t border-dashed"/><div className="border-t border-dashed"/><div className="border-t"/></div>
        {points.map(p => <div key={p.date} className="relative min-w-0">
          <div tabIndex={0} title={`${p.label}: ${format(p.value)}`} aria-label={`${p.label}: ${format(p.value)}`} className="group relative flex h-44 items-end justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <div aria-hidden="true" className="w-full max-w-9 rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-75" style={{ height: `${p.value / ceiling * 100}%` }}/>
            <span aria-hidden="true" className="pointer-events-none absolute top-1 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#101D42] px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 group-focus:opacity-100">{format(p.value)}</span>
          </div><p aria-hidden="true" className="mt-3 whitespace-nowrap text-center text-[10px] text-muted-foreground">{p.label}</p>
        </div>)}
      </div>
    </div></div>
    {!total && <p className="mt-3 text-xs text-muted-foreground">Belum ada {money ? "pendapatan" : "pesanan"} pada periode ini.</p>}
  </article>;
}
