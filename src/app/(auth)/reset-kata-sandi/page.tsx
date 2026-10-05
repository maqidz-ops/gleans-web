import { ResetPasswordForm } from "@/components/auth/reset-password-form";
export const metadata = { title: "Reset Kata Sandi", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const token = params.insforge_status === "ready" && params.insforge_type === "reset_password" && typeof params.token === "string" ? params.token : undefined;
  return <ResetPasswordForm token={token} />;
}
