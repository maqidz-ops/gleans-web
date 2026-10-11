"use server";

import { cookies } from "next/headers";
import { clearAuthCookies } from "@insforge/sdk/ssr";
import { z } from "zod";
import { SESSION_PREFERENCE_COOKIE, sessionPreferenceOptions } from "./session-preference";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { accountLandingPage } from "./session";
import { authActions, serverClient, appUrl, isAuthConfigured } from "@/features/auth/server";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@gleans/schemas/auth";

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
  let destination = "/dashboard";
  try {
    const remember = parsed.data.remember ?? false;
    const auth = await authActions(remember);
    const { data, error } = await auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    if (!error && !data?.user) return { error: "Login gagal. Silakan coba lagi." };
    if (error) return { error: message(error, error.statusCode === 403 ? "Email belum diverifikasi. Buka tautan verifikasi di email Anda." : "Email atau kata sandi salah.") };
    if (data?.user) destination = accountLandingPage(data.user);
    (await cookies()).set(SESSION_PREFERENCE_COOKIE, remember ? "persistent" : "session", sessionPreferenceOptions(remember));
  } catch { return { error: "Tidak dapat terhubung. Silakan coba lagi." }; }
  revalidatePath("/", "layout");
  redirect(destination);
}
export async function signup(values: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Periksa kembali nama, email, dan kata sandi." };
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
  redirect("/dashboard");
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
  redirect("/dashboard");
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
  const store = await cookies();
  store.delete(SESSION_PREFERENCE_COOKIE);
  try { if (isAuthConfigured()) await (await authActions()).signOut(); }
  catch { /* Local credentials must be cleared when the service is unavailable. */ }
  finally { clearAuthCookies(store); }
  revalidatePath("/", "layout");
  redirect("/masuk");
}
const profileSchema = z.object({ name: z.string().trim().min(3).max(100), whatsapp: z.string().trim().max(20).refine(value => !value || /^(\+?62|0)8\d{7,12}$/.test(value), "Nomor WhatsApp belum valid.") });
export async function updateUserProfile(values: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { error: "Periksa nama dan nomor WhatsApp." };
  const client = await serverClient();
  const { data: session, error: sessionError } = await client.auth.getCurrentUser();
  if (sessionError || !session?.user) return { error: "Sesi berakhir. Silakan masuk kembali." };
  try {
    const { error } = await client.auth.setProfile({ ...session.user.profile, ...parsed.data });
    if (error) return { error: "Profil belum dapat disimpan. Coba lagi nanti." };
  } catch { return { error: "Tidak dapat terhubung. Silakan coba lagi." }; }
  revalidatePath("/dashboard", "layout");
  return { success: true };
}
