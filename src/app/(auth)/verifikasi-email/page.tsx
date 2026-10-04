import { VerificationForm } from "@/components/auth/verification-form";
export const metadata = { title: "Verifikasi Email", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const status = params.insforge_type === "verify_email" && typeof params.insforge_status === "string" ? params.insforge_status : undefined;
  return <VerificationForm status={status} />;
}
