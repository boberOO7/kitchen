import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/account";
import AddressesContent from "./AddressesContent";

export default async function AddressesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/account/addresses");
  }

  return <AddressesContent user={user} />;
}
