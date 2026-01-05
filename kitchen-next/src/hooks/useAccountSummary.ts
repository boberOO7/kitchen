"use client";

import { useMemo, useEffect, useState } from "react";
import type { AccountSummary, ContextAction } from "@/types/account";
import { useCart } from "@/contexts/CartContext";
import { getPendingPaymentOrder } from "@/app/actions/checkout";

interface PendingOrder {
  id: string;
  total: number;
  itemCount: number;
  paymentStatus: string | null;
}

interface PendingOrderData {
  order: PendingOrder | null;
  count: number;
}

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
 * 2. Pending payment (PENDING_PAYMENT):
 *    - 1 pending -> "Оплатити замовлення" -> go to order
 *    - 2+ pending -> "Незавершені замовлення" -> go to orders list with filter
 * 3. Items in cart -> "Оформити замовлення"
 * 4. Default -> "Мій профіль"
 */
export function useAccountSummary(): UseAccountSummaryReturn {
  // Get cart count from existing cart context
  const { itemCount: cartCount } = useCart();
  
  // Fetch pending payment order data
  const [pendingData, setPendingData] = useState<PendingOrderData>({ order: null, count: 0 });
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    // Only fetch once per session
    if (hasFetched) return;
    
    async function fetchPendingOrder() {
      try {
        const result = await getPendingPaymentOrder();
        if (result.success) {
          setPendingData({
            order: result.order || null,
            count: result.pendingCount || 0,
          });
        }
      } catch (e) {
        // Ignore errors - user might not be logged in
      } finally {
        setHasFetched(true);
      }
    }
    
    fetchPendingOrder();
  }, [hasFetched]);

  const summary: AccountSummary = useMemo(() => ({
    activeShipment: undefined,      // TODO: fetch from API when shipping is implemented
    pendingPaymentOrder: pendingData.order ? { id: pendingData.order.id } : undefined,
    pendingPaymentCount: pendingData.count,
    draftOrder: undefined,          // Removed - we use cart directly
    cartCount,
  }), [cartCount, pendingData]);

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
  if (summary.pendingPaymentOrder && summary.pendingPaymentCount) {
    if (summary.pendingPaymentCount === 1) {
      // Single pending order - go directly to it
      return {
        label: "Оплатити замовлення",
        href: `/orders/${summary.pendingPaymentOrder.id}`,
        icon: "card",
      };
    } else {
      // Multiple pending orders - go to filtered orders list
      return {
        label: `Незавершені замовлення (${summary.pendingPaymentCount})`,
        href: "/account/orders?status=pending",
        icon: "card",
      };
    }
  }

  // Priority 3: Items in cart
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
