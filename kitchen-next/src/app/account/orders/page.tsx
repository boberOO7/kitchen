import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/account";
import { getUserOrders } from "@/app/actions/checkout";
import OrdersContent from "./OrdersContent";

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/account/orders");
  }

  // Fetch orders on server
  const result = await getUserOrders();
  const orders = result.success && result.orders ? result.orders : [];

  return <OrdersContent orders={orders} />;
}
