"use client";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { resetPassword } from "@/lib/auth/actions";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/auth/schema";
import { AuthCard, AuthField, PasswordInput } from "./auth-card";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm({ token }: { token?: string }) {
  const [serverError, setServerError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", confirmPassword: "" } });
  async function submit(values: ResetPasswordValues) {
    setServerError(undefined);
    const result = await resetPassword(values, token ?? "");
    if (result.error) { setServerError(result.error); toast.error(result.error); }
    else setSuccess(true);
  }
  return <AuthCard title="Reset Kata Sandi" description={success ? "Kata sandi berhasil diperbarui. Silakan masuk." : token ? "Buat kata sandi baru untuk akun Anda." : "Tautan tidak valid atau kedaluwarsa. Minta tautan pemulihan baru."} footer={<Link href={token ? "/masuk" : "/lupa-kata-sandi"} className="text-primary font-medium">{token ? "Kembali ke halaman masuk" : "Minta tautan pemulihan"}</Link>}>
    {token && !success && <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-6">
      <AuthField label="Kata sandi baru" htmlFor="password" error={errors.password?.message}><PasswordInput id="password" icon="/images/icon-lock.png" autoComplete="new-password" {...register("password")} /></AuthField>
      <AuthField label="Konfirmasi kata sandi" htmlFor="confirmPassword" error={errors.confirmPassword?.message}><PasswordInput id="confirmPassword" icon="/images/icon-lock.png" autoComplete="new-password" {...register("confirmPassword")} /></AuthField>
      {serverError && <p role="alert" className="text-destructive text-sm">{serverError}</p>}
      <Button type="submit" size="pill" disabled={isSubmitting}>{isSubmitting ? "Memproses…" : "Simpan kata sandi"}</Button>
    </form>}
  </AuthCard>;
}
