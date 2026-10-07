"use client";

import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthCard, AuthField, AuthInput, PasswordInput } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginValues } from "@/lib/auth/schema";

export function LoginForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  async function onSubmit() {
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.info("Autentikasi belum aktif. Gunakan Coba dashboard untuk menjelajahi demo.");
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
          <div className="flex items-center gap-2">
            <Controller
              name="remember"
              control={control}
              render={({ field }) => (
                <Checkbox id="remember" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label htmlFor="remember" className="font-normal">
              Ingat saya
            </Label>
          </div>
          <Link href="/lupa-kata-sandi" className="text-primary text-sm font-medium">
            Lupa Kata Sandi?
          </Link>
        </div>
        <Button type="submit" size="pill" disabled={isSubmitting} className="w-full font-normal">
          {isSubmitting && <Loader2 className="animate-spin" />}
          Masuk Sekarang
        </Button>
      </form>
      <Button asChild variant="outline" size="pill" className="mt-4 w-full"><Link href="/dashboard">Coba dashboard</Link></Button>
    </AuthCard>
  );
}
