"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthCard, AuthField, AuthInput, PasswordInput } from "@/features/auth/components/auth-card";
import { Button } from "@gleans/ui/button";
import { login } from "@/features/auth/user-actions";

import { loginSchema, type LoginValues } from "@gleans/schemas/auth";

export function LoginForm() {
  const [serverError, setServerError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" {...register("remember")} className="size-4 accent-primary" disabled={isSubmitting}/>
            Ingat saya
          </label>
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
