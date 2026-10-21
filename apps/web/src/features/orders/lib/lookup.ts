import { z } from "zod";

export type OrderLookupQuery = { kind: "invoice"; invoice: string } | { kind: "whatsapp"; numbers: string[] };

export function parseOrderLookup(input: string): OrderLookupQuery | null {
  const value = input.trim();
  if (/^GLS-[0-9a-f]{12}$/i.test(value)) return { kind: "invoice", invoice: value.toUpperCase() };
  if (/^GLS-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return { kind: "invoice", invoice: `GLS-${value.slice(4).toLowerCase()}` };
  const phone = value.replace(/[\s().-]/g, "");
  if (!/^(\+?62|0)8\d{7,12}$/.test(phone)) return null;
  const national = phone.replace(/^(\+?62|0)/, "");
  return { kind: "whatsapp", numbers: [`0${national}`, `62${national}`, `+62${national}`] };
}

export const orderLookupSchema = z.object({ query: z.string().trim().min(1).max(100) }).strict();
export const LOOKUP_COLUMNS = "id,document_name,amount,status,created_at,expires_at,paid_at,document_bytes,fulfillment_status,report_expires_at";
export type LookupOrder = {
  id: string;
  document_name: string;
  amount: number;
  status: "draft" | "creating" | "pending" | "paid" | "failed" | "expired";
  created_at: string;
  expires_at?: string | null;
  paid_at?: string | null;
  document_bytes?: number;
  fulfillment_status?: "pending" | "processing" | "completed" | "failed";
  report_expires_at?: string | null;
};
export const orderStatusLabels: Record<LookupOrder["status"], string> = {
  draft: "Belum dibayar", creating: "Menyiapkan pembayaran", pending: "Menunggu pembayaran",
  paid: "Pembayaran terverifikasi", failed: "Pembayaran gagal", expired: "Pembayaran kedaluwarsa",
};

export type PublicLookupOrder = Pick<LookupOrder, "id" | "status" | "created_at"> & {
  document_name: string;
  amount: number;
  document_bytes: number | null;
  fulfillment_status: "pending" | "processing" | "completed" | "failed";
  report_expires_at?: string | null;
  can_open: boolean;
  can_download: boolean;
};
export const PUBLIC_LOOKUP_COLUMNS = "id,document_name,document_bytes,amount,status,created_at,fulfillment_status,report_expires_at";
export function lookupSummary(order: LookupOrder, _kind: OrderLookupQuery["kind"], downloadAccess = false): PublicLookupOrder {
  return {
    id: order.id, status: order.status, created_at: order.created_at,
    document_name: order.document_name, amount: order.amount,
    document_bytes: order.document_bytes ?? null,
    fulfillment_status: order.fulfillment_status ?? "pending",
    report_expires_at: order.report_expires_at ?? null,
    can_open: true,
    can_download: downloadAccess && order.status === "paid" && order.fulfillment_status === "completed" && Date.parse(order.report_expires_at ?? "") > Date.now(),
  };
}
