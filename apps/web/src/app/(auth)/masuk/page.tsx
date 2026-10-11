import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Masuk Sekarang",
  description: "Masuk ke akun Gleans untuk melihat riwayat pesanan dan hasil pemeriksaan dokumenmu.",
};

export default function MasukPage() {
  return <LoginForm />;
}
