import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/account";
import AccountContent from "./AccountContent";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/account");
  }

  return <AccountContent user={user} />;
}
