import { redirect } from "next/navigation";
import { currentUser } from "@/features/auth/server";
import { accountLandingPage } from "@/features/auth/session";
export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/masuk");
  redirect(accountLandingPage(user));
}
