"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { resendVerification, verifyCode } from "@/lib/auth/actions";
import { AuthCard, AuthField, AuthInput } from "./auth-card";
import { Button } from "@/components/ui/button";

export function VerificationForm({ email: initialEmail = "", method = "link", status }: { email?: string; method?: string; status?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const result = method === "code" ? await verifyCode(email, otp) : await resendVerification(email);
      if (result?.error) toast.error(result.error);
      else toast.success("Email verifikasi telah dikirim. Periksa juga folder spam.");
    } finally { setPending(false); }
  }
  return <AuthCard title="Verifikasi Email" description={status === "success" ? "Email berhasil diverifikasi. Silakan masuk ke akun Anda." : status === "error" ? "Tautan tidak valid atau kedaluwarsa. Kirim ulang email verifikasi." : method === "code" ? "Masukkan kode 6 digit yang dikirim ke email Anda." : "Buka tautan verifikasi di email Anda sebelum masuk."} footer={<Link href="/masuk" className="text-primary font-medium">Kembali ke halaman masuk</Link>}>
    {status !== "success" && <form onSubmit={submit} className="flex flex-col gap-6">
      <AuthField label="Email" htmlFor="verification-email"><AuthInput id="verification-email" icon="/images/icon-mail.png" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></AuthField>
      {method === "code" && <AuthField label="Kode verifikasi" htmlFor="otp"><AuthInput id="otp" icon="/images/icon-lock.png" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} /></AuthField>}
      <Button type="submit" size="pill" disabled={pending}>{pending ? "Memproses…" : method === "code" ? "Verifikasi" : "Kirim ulang email"}</Button>
      {method === "code" && <Button type="button" variant="outline" disabled={pending} onClick={async () => { setPending(true); try { const result = await resendVerification(email); if (result.error) toast.error(result.error); else toast.success("Kode baru telah dikirim."); } finally { setPending(false); } }}>Kirim ulang kode</Button>}
    </form>}
  </AuthCard>;
}
