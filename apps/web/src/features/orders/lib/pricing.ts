import { z } from "zod";

export const whatsappSchema = z
  .string()
  .trim()
  .min(1, "Nomor WhatsApp wajib diisi.")
  .transform((value) => value.replace(/[\s().-]/g, ""))
  .refine((value) => /^(\+?62|0)8\d{7,12}$/.test(value), "Masukkan nomor WhatsApp Indonesia yang valid.");

type PromoRule = { code: string; label: string; percent?: number; amount?: number };

const PROMO_RULES: PromoRule[] = [
  { code: "GLEANS10", label: "Diskon 10%", percent: 10 },
  { code: "MAHASISWA", label: "Potongan Rp 2.000", amount: 2_000 },
  { code: "SKRIPSIAMAN", label: "Diskon 25%", percent: 25 },
];

export type AppliedPromo = { code: string; label: string; discount: number };

export function resolvePromo(input: string, subtotal: number): AppliedPromo | null {
  const code = input.trim().toUpperCase();
  const rule = PROMO_RULES.find((r) => r.code === code);
  if (!rule) return null;
  const raw = rule.percent ? Math.round((subtotal * rule.percent) / 100) : (rule.amount ?? 0);
  return { code: rule.code, label: rule.label, discount: Math.min(raw, subtotal) };
}
