import { z } from "zod";

const email = z.string().trim().min(1, "Email wajib diisi.").email("Format email belum benar.");
const password = z.string().min(8, "Kata sandi minimal 8 karakter.");

export const registerSchema = z.object({
  name: z.string().trim().min(3, "Nama lengkap minimal 3 karakter."),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password,
});

export const forgotPasswordSchema = z.object({ email });

export type RegisterValues = z.infer<typeof registerSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({ password, confirmPassword: z.string() }).refine(
  (values) => values.password === values.confirmPassword,
  { message: "Konfirmasi kata sandi harus sama.", path: ["confirmPassword"] },
);
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
