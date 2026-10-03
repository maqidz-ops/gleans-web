"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex w-full max-w-[440px] flex-col gap-8 rounded-[24px] border bg-white p-4">
      <div className="flex flex-col gap-4">
        <Image
          src="/images/gleans-mark.png"
          alt=""
          width={60}
          height={60}
          className="size-[60px] rounded-[16px]"
        />
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
      {children}
      <p className="text-center text-sm">{footer}</p>
    </div>
  );
}

export function AuthField({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}

export function AuthInput({
  icon,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { icon: string }) {
  return (
    <div className="relative">
      <Image
        src={icon}
        alt=""
        width={20}
        height={20}
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
      />
      <Input className={cn("h-12 rounded-full py-3 pr-3 pl-11 md:text-base", className)} {...props} />
    </div>
  );
}

export function PasswordInput({
  icon,
  ...props
}: React.ComponentProps<typeof Input> & { icon: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Image
        src={icon}
        alt=""
        width={20}
        height={20}
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
      />
      <Input
        type={visible ? "text" : "password"}
        className="h-12 rounded-full py-3 pr-11 pl-11 md:text-base"
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        className="absolute top-1/2 right-3 -translate-y-1/2"
      >
        <Image
          src={visible ? "/images/icon-eye-slash.png" : "/images/icon-eye.png"}
          alt=""
          width={20}
          height={20}
          className="size-5"
        />
      </button>
    </div>
  );
}
