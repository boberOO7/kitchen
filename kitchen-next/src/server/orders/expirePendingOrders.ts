import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

/**
 * Expire all PENDING_PAYMENT orders that have passed their expiresAt time.
 * Updates status to EXPIRED and sets expiredAt timestamp.
 * 
 * @returns The number of orders that were expired
 */
export async function expirePendingOrders(): Promise<number> {
  const now = new Date();
  
  const result = await prisma.order.updateMany({
    where: {
      status: OrderStatus.PENDING_PAYMENT,
      expiresAt: {
        not: null,
        lt: now,
      },
    },
    data: {
      status: OrderStatus.EXPIRED,
      expiredAt: now,
    },
  });
  
  if (result.count > 0) {
    console.log(`[expirePendingOrders] Expired ${result.count} order(s)`);
  }
  
  return result.count;
}

/**
 * Configuration for order expiration.
 * Default: 48 hours (in milliseconds)
 */
export const ORDER_EXPIRATION_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Calculate the expiration date for a new pending order.
 */
export function getOrderExpirationDate(): Date {
  return new Date(Date.now() + ORDER_EXPIRATION_MS);
}

