"use client";

import { useMemo } from "react";
import type { AccountSummary, ContextAction } from "@/types/account";
import { useCart } from "@/contexts/CartContext";

interface UseAccountSummaryReturn {
  summary: AccountSummary;
  contextAction: ContextAction;
}

/**
 * Hook to get account summary data for the header dropdown.
 * Returns context-aware action based on user state.
 * 
 * Priority for context action:
 * 1. Active shipment -> "Відстежити посилку"
 * 2. Pending payment (PENDING_PAYMENT) -> "Оплатити замовлення"
 * 3. Draft order (checkout in progress) -> "Завершити оформлення"
 * 4. Items in cart -> "Оформити замовлення"
 * 5. Default -> "Мій профіль"
 */
export function useAccountSummary(): UseAccountSummaryReturn {
  // Get cart count from existing cart context
  const { itemCount: cartCount } = useCart();

  // TODO: Fetch real data from API when implemented
  // const { data: orderData } = useSWR('/api/account/summary');
  
  const summary: AccountSummary = useMemo(() => ({
    activeShipment: undefined,      // TODO: fetch from API
    pendingPaymentOrder: undefined, // TODO: fetch from API
    draftOrder: undefined,          // TODO: fetch from API
    cartCount,
  }), [cartCount]);

  // Calculate context-aware action
  const contextAction = getContextAction(summary);

  return { summary, contextAction };
}

/**
 * Determine the context-aware action based on user state.
 */
function getContextAction(summary: AccountSummary): ContextAction {
  // Priority 1: Active shipment
  if (summary.activeShipment) {
    return {
      label: "Відстежити посилку",
      href: `/account/orders/${summary.activeShipment.orderId}?tab=tracking`,
      icon: "truck",
    };
  }

  // Priority 2: Pending payment (order complete, awaiting payment)
  if (summary.pendingPaymentOrder) {
    return {
      label: "Оплатити замовлення",
      href: `/checkout/payment?orderId=${summary.pendingPaymentOrder.id}`,
      icon: "card",
    };
  }

  // Priority 3: Draft order (checkout started but not complete)
  if (summary.draftOrder) {
    return {
      label: "Завершити оформлення",
      href: `/checkout?orderId=${summary.draftOrder.id}`,
      icon: "cart",
    };
  }

  // Priority 4: Items in cart (no order yet)
  if (summary.cartCount > 0) {
    return {
      label: "Оформити замовлення",
      href: "/checkout",
      icon: "cart",
    };
  }

  // Default: Profile
  return {
    label: "Мій профіль",
    href: "/account",
    icon: "user",
  };
}

