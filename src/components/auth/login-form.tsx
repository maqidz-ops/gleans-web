"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthCard, AuthField, AuthInput, PasswordInput } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { login } from "@/lib/auth/actions";

import { loginSchema, type LoginValues } from "@/lib/auth/schema";

export function LoginForm() {
  const [serverError, setServerError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setServerError(undefined);
    const result = await login(values);
    if (result?.error) { setServerError(result.error); toast.error(result.error); }
  }

  return (
    <AuthCard
      title="Masuk Sekarang"
      description="Masuk ke akun Gleans kamu sekarang!"
      footer={
        <>
          Belum memiliki akun?{" "}
          <Link href="/daftar" className="text-primary font-medium">
            Daftar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
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
        <AuthField label="Kata Sandi" htmlFor="password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            icon="/images/icon-lock.png"
            autoComplete="current-password"
            placeholder="Masukkan Kata Sandi"
            {...register("password")}
          />
        </AuthField>
        <div className="flex items-center justify-between gap-4">
          <Link href="/lupa-kata-sandi" className="text-primary text-sm font-medium">
            Lupa Kata Sandi?
          </Link>
        </div>
        {serverError && <p role="alert" className="text-destructive text-sm">{serverError}</p>}
        <Button type="submit" size="pill" disabled={isSubmitting} className="w-full font-normal">
          {isSubmitting && <Loader2 className="animate-spin" />}
          Masuk Sekarang
        </Button>
      </form>
    </AuthCard>
  );
}
