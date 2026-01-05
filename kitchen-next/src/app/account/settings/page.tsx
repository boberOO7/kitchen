import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/account";
import SettingsContent from "./SettingsContent";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/account/settings");
  }

  return <SettingsContent user={user} />;
}
