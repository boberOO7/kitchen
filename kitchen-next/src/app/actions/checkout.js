"use server";

import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";

/**
 * Initiate Monobank payment for the user's cart
 * Returns pageUrl for redirect
 */
export async function initiateMonobankPayment() {
  try {
    const { appUser } = await requireAppUser();

    // Find user's DRAFT order (cart)
    const order = await prisma.order.findFirst({
      where: {
        userId: appUser.id,
        status: "DRAFT",
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return { success: false, error: "Кошик порожній" };
    }

    if (order.items.length === 0) {
      return { success: false, error: "Кошик порожній" };
    }

    if (order.total <= 0) {
      return { success: false, error: "Сума замовлення має бути більше 0" };
    }

    // Return orderId for client to call the API endpoint
    // We use API endpoint because we need request headers for origin URL
    return { 
      success: true, 
      orderId: order.id,
    };
  } catch (error) {
    console.error("initiateMonobankPayment error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    
    return { success: false, error: "Не вдалося ініціювати оплату" };
  }
}

/**
 * Get order status for checkout success page (legacy)
 */
export async function getOrderStatus(orderId) {
  return getOrderDetails(orderId);
}

/**
 * Get full order details with items, products, and payment info
 */
export async function getOrderDetails(orderId) {
  try {
    const { appUser } = await requireAppUser();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order || order.userId !== appUser.id) {
      return { success: false, error: "Замовлення не знайдено" };
    }

    const latestPayment = order.payments[0] || null;

    return {
      success: true,
      order: {
        id: order.id,
        status: order.status,
        subtotal: order.subtotal,
        total: order.total,
        currency: order.currency,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items: order.items.map((item) => ({
          id: item.id,
          name: item.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          total: item.total,
          product: item.product
            ? {
                id: item.product.id,
                name: item.product.name,
                imageKey: item.product.imageKey,
              }
            : null,
        })),
      },
      payment: latestPayment
        ? {
            id: latestPayment.id,
            status: latestPayment.status,
            provider: latestPayment.provider,
            amount: latestPayment.amount,
            createdAt: latestPayment.createdAt.toISOString(),
          }
        : null,
    };
  } catch (error) {
    console.error("getOrderDetails error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    
    return { success: false, error: "Не вдалося отримати замовлення" };
  }
}

