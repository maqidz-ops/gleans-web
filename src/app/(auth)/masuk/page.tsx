import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Masuk Sekarang",
  description: "Masuk ke akun Gleans untuk melihat riwayat pesanan dan hasil pemeriksaan dokumenmu.",
};

export default function MasukPage() {
  return <LoginForm />;
}
