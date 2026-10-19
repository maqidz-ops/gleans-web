export type PaymentStatus = "draft" | "creating" | "pending" | "paid" | "failed" | "expired";
export type PaymentOrder = {
  id: string;
  document_name: string;
  amount: number;
  status: PaymentStatus;
  payment_method: string | null;
  payment_url: string | null;
  qr_string: string | null;
  reference: string | null;
  created_at: string;
  expires_at: string | null;
  paid_at: string | null;
};
export const PAYMENT_DOCUMENT_BUCKET = "shield-sandbox-documents";
