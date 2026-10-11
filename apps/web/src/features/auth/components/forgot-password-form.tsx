"use client";

import { forgotPassword } from "@/features/auth/user-actions";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthCard, AuthField, AuthInput } from "@/features/auth/components/auth-card";
import { Button } from "@gleans/ui/button";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@gleans/schemas/auth";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setServerError(undefined);
    const result = await forgotPassword(values);
    if (result.error) { setServerError(result.error); toast.error(result.error); }
    else toast.success("Jika email terdaftar, tautan pemulihan akan dikirim. Periksa juga folder spam.");
  }

  return (
    <AuthCard
      title="Lupa Kata Sandi"
      description="Kami bantu pulihkan akun kamu!"
      footer={
        <>
          Sudah memiliki akun?{" "}
          <Link href="/masuk" className="text-primary font-medium">
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10">
        <AuthField label="Email" htmlFor="email" error={errors.email?.message}>
          <AuthInput
            id="email"
            icon="/images/icon-mail.png"
            type="email"
            autoComplete="email"
            placeholder="kamu@gmail.com"
            {...register("email")}
          />
        </AuthField>
        {serverError && <p role="alert" className="text-destructive text-sm">{serverError}</p>}
        <Button type="submit" size="pill" disabled={isSubmitting} className="w-full font-normal">
          {isSubmitting && <Loader2 className="animate-spin" />}
          Kirim Lewat Email
        </Button>
      </form>
    </AuthCard>
  );
}
