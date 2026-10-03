"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthCard, AuthField, AuthInput, PasswordInput } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { registerSchema, type RegisterValues } from "@/lib/auth/schema";

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterValues) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success(`Akun untuk ${values.email} siap dibuat. Autentikasi segera hadir.`);
  }

  return (
    <AuthCard
      title="Daftar Sekarang"
      description="Daftarkan akun Gleans kamu sekarang!"
      footer={
        <>
          Sudah memiliki akun?{" "}
          <Link href="/masuk" className="text-primary font-medium">
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField label="Nama Lengkap" htmlFor="name" error={errors.name?.message}>
            <AuthInput id="name" icon="/images/icon-user.png" autoComplete="name" placeholder="Nama Lengkap" {...register("name")} />
          </AuthField>
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
        </div>
        <AuthField label="Kata Sandi" htmlFor="password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            icon="/images/icon-lock.png"
            autoComplete="new-password"
            placeholder="Masukkan Kata Sandi"
            {...register("password")}
          />
        </AuthField>
        <Button type="submit" size="pill" disabled={isSubmitting} className="w-full font-normal">
          {isSubmitting && <Loader2 className="animate-spin" />}
          Daftar Sekarang
        </Button>
      </form>
    </AuthCard>
  );
}
