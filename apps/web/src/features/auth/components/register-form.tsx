"use client";

import { useState } from "react";
import { signup } from "@/features/auth/user-actions";
import { VerificationForm } from "@/features/auth/components/verification-form";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthCard, AuthField, AuthInput, PasswordInput } from "@/features/auth/components/auth-card";
import { Button } from "@gleans/ui/button";
import { passwordRequirements, registerSchema, type RegisterValues } from "@gleans/schemas/auth";

export function RegisterForm() {
  const [serverError, setServerError] = useState<string>();
  const [verification, setVerification] = useState<{ email: string; method?: string } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterValues) {
    setServerError(undefined);
    const result = await signup(values);
    if (result?.error) { setServerError(result.error); toast.error(result.error); }
    else if (result?.verification) setVerification({ email: values.email, method: result.method });
  }

  if (verification) return <VerificationForm email={verification.email} method={verification.method} />;

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
        <AuthField label="Kata Sandi" htmlFor="password">
          <PasswordInput
            id="password"
            icon="/images/icon-lock.png"
            autoComplete="new-password"
            placeholder="Masukkan Kata Sandi"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-requirements" : undefined}
            {...register("password")}
          />
          {errors.password && <p id="password-requirements" role="alert" className="text-sm text-destructive">{passwordRequirements}</p>}
        </AuthField>
        {serverError && <p role="alert" className="text-destructive text-sm">{serverError}</p>}
        <Button type="submit" size="pill" disabled={isSubmitting} className="w-full font-normal">
          {isSubmitting && <Loader2 className="animate-spin" />}
          Daftar Sekarang
        </Button>
      </form>
    </AuthCard>
  );
}
