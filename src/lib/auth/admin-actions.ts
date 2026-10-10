"use server";

import { cookies } from "next/headers";
import { createAuthActions, clearAuthCookies } from "@insforge/sdk/ssr";
import { redirect } from "next/navigation";
import { loginSchema, type LoginValues } from "./schema";
import { adminAuthConfigured } from "@/lib/insforge/server";

export async function signInAdmin(values: LoginValues) {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { error: "Periksa email dan kata sandi." };
  if (!adminAuthConfigured()) return { error: "Login admin belum dikonfigurasi." };
  if (parsed.data.email.toLowerCase() !== process.env.GLEANS_ADMIN_EMAIL?.toLowerCase()) return { error: "Email atau kata sandi tidak sesuai." };
  const cookieStore = await cookies();
  const auth = createAuthActions({ cookies: cookieStore });
  const { data, error } = await auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error || !data?.user) {
    return { error: error?.statusCode === 403 ? "Verifikasi email admin terlebih dahulu melalui tautan yang dikirim ke email." : "Email atau kata sandi tidak sesuai. Silakan coba lagi." };
  }
  if (data.user.id !== process.env.GLEANS_ADMIN_USER_ID) {
    await auth.signOut();
    clearAuthCookies(cookieStore);
    return { error: "Akun ini tidak memiliki akses admin." };
  }
  if (!parsed.data.remember) {
    for (const name of ["insforge_access_token", "insforge_refresh_token"]) {
      const token = cookieStore.get(name)?.value;
      if (token) cookieStore.set(name, token, { httpOnly: name === "insforge_refresh_token", secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
    }
  }
  redirect("/admin");
}

export async function signOutAdmin() {
  const cookieStore = await cookies();
  try { await createAuthActions({ cookies: cookieStore }).signOut(); }
  catch { /* Clear local credentials even if the auth service is unavailable. */ }
  finally { clearAuthCookies(cookieStore); }
  redirect("/masuk");
}
