import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Daftar Sekarang",
  description: "Daftarkan akun Gleans untuk mengelola pesanan cek dokumen dan paket langgananmu.",
};

export default function DaftarPage() {
  return <RegisterForm />;
}
