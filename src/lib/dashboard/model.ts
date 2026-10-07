import { z } from "zod";
import { PLANS, SHIELD_PRICE } from "../plans";

export const STORAGE_KEY = "gleans:dashboard-demo:v1";
export type Method = "quota" | "balance" | "qris";
export type Outcome = "success" | "failed" | "expired";
export type Payment = "paid" | "pending" | "failed" | "expired" | "refunded";
export type Processing = "waiting" | "queued" | "processing" | "completed" | "failed";
export type Purchase = { id: string; kind: "topup" | "package" | "order"; amount: number; planId?: string; document?: string; method: Method; at: string };
export type Order = { id: string; document: string; words: number; amount: number; method: Method; payment: Payment; processing: Processing; at: string };
export type Transaction = { id: string; title: string; kind: "topup" | "payment" | "refund"; amount: number; method: Method; outcome: Outcome; at: string };
export type DemoState = { profile: { name: string; email: string; whatsapp: string }; balance: number; quota: number; orders: Order[]; transactions: Transaction[]; settled: string[] };
export type DemoAction = { type: "purchase"; purchase: Purchase; outcome: Outcome } | { type: "progress"; id: string; status: Processing; at: string } | { type: "profile"; profile: DemoState["profile"] } | { type: "reset"; empty?: boolean };

const method = z.enum(["quota", "balance", "qris"]);
export const demoSchema = z.object({
  profile: z.object({ name: z.string().min(1).max(100), email: z.string().email(), whatsapp: z.string().max(20) }),
  balance: z.number().int().nonnegative(), quota: z.number().int().nonnegative(),
  orders: z.array(z.object({ id: z.string(), document: z.string(), words: z.number().int().nonnegative(), amount: z.number().int().nonnegative(), method, payment: z.enum(["paid", "pending", "failed", "expired", "refunded"]), processing: z.enum(["waiting", "queued", "processing", "completed", "failed"]), at: z.string().datetime() })),
  transactions: z.array(z.object({ id: z.string(), title: z.string(), kind: z.enum(["topup", "payment", "refund"]), amount: z.number().int(), method, outcome: z.enum(["success", "failed", "expired"]), at: z.string().datetime() })),
  settled: z.array(z.string()),
});
export function initialDemo(empty = false): DemoState {
  return { profile: { name: "Alya Putri", email: "alya@example.com", whatsapp: "081234567890" }, balance: empty ? 0 : 50_000, quota: empty ? 0 : 2,
    orders: empty ? [] : [
      { id: "DEMO-1002", document: "Proposal penelitian.pdf", words: 3200, amount: SHIELD_PRICE, method: "qris", payment: "pending", processing: "waiting", at: "2026-10-07T08:00:00.000Z" },
      { id: "DEMO-1001", document: "Makalah metodologi.docx", words: 1800, amount: SHIELD_PRICE, method: "quota", payment: "paid", processing: "completed", at: "2026-10-06T08:00:00.000Z" },
    ], transactions: empty ? [] : [{ id: "seed-topup", title: "Top-up saldo demo", kind: "topup", amount: 50_000, method: "qris", outcome: "success", at: "2026-10-05T08:00:00.000Z" }], settled: [] };
}
export function purchaseError(state: DemoState, p: Purchase): string | null {
  if (!Number.isSafeInteger(p.amount) || p.amount <= 0) return "Nominal tidak valid.";
  if (p.kind === "topup" && (p.amount < 10_000 || p.method !== "qris")) return "Top-up minimal Rp10.000 melalui QRIS demo.";
  if (p.kind === "package") { const plan = PLANS.find(x => x.id === p.planId); if (!plan || p.amount !== plan.price || p.method === "quota") return "Paket tidak valid."; }
  if (p.kind === "order" && p.amount !== SHIELD_PRICE) return "Harga pesanan tidak valid.";
  if (p.method === "balance" && state.balance < p.amount) return "Saldo belum cukup. Isi saldo atau pilih QRIS demo.";
  if (p.method === "quota" && state.quota < 1) return "Kuota habis. Pilih saldo atau QRIS demo.";
  return null;
}
export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  if (action.type === "reset") return initialDemo(action.empty);
  if (action.type === "profile") return { ...state, profile: action.profile };
  if (action.type === "purchase") {
    const p = action.purchase;
    if (state.settled.includes(p.id) || purchaseError(state, p)) return state;
    const success = action.outcome === "success";
    const plan = PLANS.find(x => x.id === p.planId);
    const payment: Payment = action.outcome === "success" ? "paid" : action.outcome;
    const existing = state.orders.find(x => x.id === p.id);
    if (existing && existing.payment !== "pending") return state;
    const order: Order = { id: p.id, document: p.document || "Dokumen contoh.pdf", words: existing?.words ?? 2400, amount: p.amount, method: p.method, payment, processing: success ? "queued" : "waiting", at: p.at };
    const transaction: Transaction = { id: p.id, title: p.kind === "topup" ? "Top-up saldo" : p.kind === "package" ? `Paket ${plan?.name}` : `Shield · ${order.document}`, kind: p.kind === "topup" ? "topup" : "payment", amount: p.kind === "topup" ? p.amount : -p.amount, method: p.method, outcome: action.outcome, at: p.at };
    return { ...state, settled: [...state.settled, p.id], balance: state.balance + (success ? p.kind === "topup" ? p.amount : p.method === "balance" ? -p.amount : 0 : 0), quota: state.quota + (success ? p.kind === "package" ? plan!.checks : p.method === "quota" ? -1 : 0 : 0),
      orders: p.kind === "order" ? [order, ...state.orders.filter(x => x.id !== p.id)] : state.orders, transactions: [transaction, ...state.transactions] };
  }
  const order = state.orders.find(x => x.id === action.id);
  if (!order || order.payment !== "paid" || !["queued", "processing"].includes(order.processing) || !["processing", "completed", "failed"].includes(action.status)) return state;
  if (order.processing === action.status) return state;
  const refund = action.status === "failed";
  return { ...state, balance: state.balance + (refund && order.method === "balance" ? order.amount : 0), quota: state.quota + (refund && order.method === "quota" ? 1 : 0),
    orders: state.orders.map(x => x.id === order.id ? { ...x, processing: action.status, payment: refund ? "refunded" : x.payment } : x),
    transactions: refund ? [{ id: `refund-${order.id}`, title: `Pengembalian · ${order.document}`, kind: "refund", amount: order.amount, method: order.method, outcome: "success", at: action.at }, ...state.transactions] : state.transactions };
}
