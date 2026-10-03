"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthCard, AuthField, AuthInput } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/auth/schema";

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success(`Tautan pemulihan akan dikirim ke ${values.email}.`);
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
        <Button type="submit" size="pill" disabled={isSubmitting} className="w-full font-normal">
          {isSubmitting && <Loader2 className="animate-spin" />}
          Kirim Lewat Email
        </Button>
      </form>
    </AuthCard>
  );
}
