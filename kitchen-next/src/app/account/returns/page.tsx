import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/account";
import ReturnsContent from "./ReturnsContent";

export default async function ReturnsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/account/returns");
  }

  return <ReturnsContent user={user} />;
}
