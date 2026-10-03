import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Lupa Kata Sandi",
  description: "Pulihkan akses akun Gleans kamu lewat tautan pemulihan yang dikirim ke email.",
};

export default function LupaKataSandiPage() {
  return <ForgotPasswordForm />;
}
