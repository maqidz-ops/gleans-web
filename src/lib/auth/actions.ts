"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authActions, serverClient, appUrl, isAuthConfigured } from "@/lib/insforge/server";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "./schema";

type ActionResult = { error?: string; success?: boolean; verification?: boolean; method?: string };
const unavailable = { error: "Layanan akun belum dikonfigurasi. Silakan coba lagi nanti." };
function message(error: { statusCode?: number; message?: string }, fallback: string) {
  if (error.statusCode === 429) return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  return fallback;
}
export async function login(values: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { error: "Periksa kembali email dan kata sandi." };
  if (!isAuthConfigured()) return unavailable;
  try {
    const auth = await authActions();
    const { data, error } = await auth.signInWithPassword(parsed.data);
    if (!error && !data?.user) return { error: "Login gagal. Silakan coba lagi." };
    if (error) return { error: message(error, error.statusCode === 403 ? "Email belum diverifikasi. Buka tautan verifikasi di email Anda." : "Email atau kata sandi salah.") };
  } catch { return { error: "Tidak dapat terhubung. Silakan coba lagi." }; }
  revalidatePath("/", "layout");
  redirect("/akun");
}
export async function signup(values: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) return { error: "Periksa kembali nama, email, dan kata sandi." };
  if (!isAuthConfigured()) return unavailable;
  try {
    const auth = await authActions();
    const { data, error } = await auth.signUp({ ...parsed.data, redirectTo: appUrl("/verifikasi-email") });
    if (error) return { error: message(error, "Pendaftaran gagal. Periksa data atau coba masuk jika sudah memiliki akun.") };
    if (data?.requireEmailVerification) {
      const client = await serverClient();
      const { data: config } = await client.auth.getPublicAuthConfig();
      return { verification: true, method: config?.verifyEmailMethod ?? "link" };
    }
  } catch { return { error: "Tidak dapat terhubung. Silakan coba lagi." }; }
  revalidatePath("/", "layout");
  redirect("/akun");
}
export async function resendVerification(email: string): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) return { error: "Format email belum benar." };
  if (!isAuthConfigured()) return unavailable;
  try {
    const client = await serverClient();
    const { error } = await client.auth.resendVerificationEmail({ email: parsed.data.email, redirectTo: appUrl("/verifikasi-email") });
    if (error) return { error: message(error, "Email verifikasi belum dapat dikirim. Coba lagi nanti.") };
    return { success: true };
  } catch { return { error: "Tidak dapat terhubung. Silakan coba lagi." }; }
}
export async function verifyCode(email: string, otp: string): Promise<ActionResult> {
  if (!forgotPasswordSchema.safeParse({ email }).success || !/^\d{6}$/.test(otp)) return { error: "Masukkan email dan kode 6 digit yang valid." };
  if (!isAuthConfigured()) return unavailable;
  try {
    const auth = await authActions();
    const { error } = await auth.verifyEmail({ email, otp });
    if (error) return { error: message(error, "Kode tidak valid atau kedaluwarsa. Minta kode baru.") };
  } catch { return { error: "Tidak dapat terhubung. Silakan coba lagi." }; }
  revalidatePath("/", "layout");
  redirect("/akun");
}
export async function forgotPassword(values: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) return { error: "Format email belum benar." };
  if (!isAuthConfigured()) return unavailable;
  try {
    const client = await serverClient();
    const { error } = await client.auth.sendResetPasswordEmail({ email: parsed.data.email, redirectTo: appUrl("/reset-kata-sandi") });
    if (error && error.statusCode !== 404) return { error: message(error, "Permintaan pemulihan gagal. Coba lagi nanti.") };
    return { success: true };
  } catch { return { error: "Tidak dapat terhubung. Silakan coba lagi." }; }
}
export async function resetPassword(values: unknown, token: string): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success || !token || token.length > 4096) return { error: "Periksa kata sandi dan tautan pemulihan." };
  if (!isAuthConfigured()) return unavailable;
  try {
    const client = await serverClient();
    const { error } = await client.auth.resetPassword({ newPassword: parsed.data.password, otp: token });
    if (error) return { error: message(error, "Tautan tidak valid atau kedaluwarsa. Minta tautan pemulihan baru.") };
    return { success: true };
  } catch { return { error: "Tidak dapat terhubung. Silakan coba lagi." }; }
}
export async function logout() {
  if (isAuthConfigured()) {
    const auth = await authActions();
    await auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/masuk");
}
