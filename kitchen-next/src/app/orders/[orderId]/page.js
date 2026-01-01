import { redirect } from "next/navigation";
import { requireAppUser } from "@/lib/auth";
import OrderPageContent from "./OrderPageContent";

export const metadata = {
  title: "Замовлення | Sky Kitchens",
};

export default async function OrderPage({ params, searchParams }) {
  // Next.js 15: params and searchParams are Promises
  const { orderId } = await params;
  const { success } = await searchParams;

  // Auth check - redirect to login if not authenticated
  try {
    await requireAppUser();
  } catch (error) {
    redirect(`/login?redirect=/orders/${orderId}`);
  }

  return (
    <OrderPageContent 
      orderId={orderId} 
      showSuccessAnimation={success === "1"} 
    />
  );
}

