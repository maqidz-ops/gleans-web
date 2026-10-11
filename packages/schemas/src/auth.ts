import { z } from "zod";

const email = z.string().trim().min(1, "Email wajib diisi.").email("Format email belum benar.");
const password = z.string().min(8, "Kata sandi minimal 8 karakter.");
export const passwordRequirements = "Minimal 8 karakter, dengan huruf besar, huruf kecil, angka, dan simbol.";
const newPassword = password
  .regex(/[a-z]/, "Kata sandi harus memiliki huruf kecil.")
  .regex(/[A-Z]/, "Kata sandi harus memiliki huruf besar.")
  .regex(/[0-9]/, "Kata sandi harus memiliki angka.")
  .regex(/[^A-Za-z0-9\s]/, "Kata sandi harus memiliki simbol, misalnya ! atau @.");

export const registerSchema = z.object({
  name: z.string().trim().min(3, "Nama lengkap minimal 3 karakter."),
  email,
  password: newPassword,
});

export const loginSchema = z.object({
  email,
  password,
  remember: z.boolean(),
});

export const forgotPasswordSchema = z.object({ email });

export type RegisterValues = z.infer<typeof registerSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({ password: newPassword, confirmPassword: z.string() }).refine(
  (values) => values.password === values.confirmPassword,
  { message: "Konfirmasi kata sandi harus sama.", path: ["confirmPassword"] },
);
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
