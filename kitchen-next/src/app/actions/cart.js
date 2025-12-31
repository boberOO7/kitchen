"use server";

import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Get or create DRAFT order (cart) for current user
 */
async function getOrCreateCart(userId) {
  let cart = await prisma.order.findFirst({
    where: {
      userId,
      status: "DRAFT",
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.order.create({
      data: {
        userId,
        status: "DRAFT",
        currency: "USD",
        subtotal: 0,
        total: 0,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  return cart;
}

/**
 * Recalculate order totals based on items
 */
async function recalculateOrderTotals(orderId) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
  });

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  await prisma.order.update({
    where: { id: orderId },
    data: {
      subtotal,
      total: subtotal, // Can add shipping/discounts later
    },
  });
}

/**
 * Get current user's cart with items and products
 */
export async function getCart() {
  try {
    const { appUser } = await requireAppUser();
    const cart = await getOrCreateCart(appUser.id);

    return {
      success: true,
      cart: {
        id: cart.id,
        subtotal: cart.subtotal,
        total: cart.total,
        currency: cart.currency,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        items: cart.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          total: item.total,
          product: item.product
            ? {
                id: item.product.id,
                name: item.product.name,
                imageKey: item.product.imageKey,
                price: item.product.price,
              }
            : null,
        })),
      },
    };
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED", cart: null };
    }
    console.error("getCart error:", error);
    return { success: false, error: "Failed to get cart", cart: null };
  }
}

/**
 * Add product to cart (or increase quantity if already exists)
 */
export async function addToCart(productId, quantity = 1) {
  try {
    const { appUser } = await requireAppUser();

    // Get product info
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      return { success: false, error: "Product not found" };
    }

    // Get or create cart
    const cart = await getOrCreateCart(appUser.id);

    // Check if item already exists in cart
    const existingItem = await prisma.orderItem.findFirst({
      where: {
        orderId: cart.id,
        productId,
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      const lineTotal = newQuantity * existingItem.unitPrice;

      await prisma.orderItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          total: lineTotal,
        },
      });
    } else {
      // Create new item
      const lineTotal = quantity * product.price;

      await prisma.orderItem.create({
        data: {
          orderId: cart.id,
          productId,
          name: product.name,
          unitPrice: product.price,
          quantity,
          total: lineTotal,
        },
      });
    }

    // Recalculate order totals
    await recalculateOrderTotals(cart.id);

    revalidatePath("/cart");

    return { success: true };
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    console.error("addToCart error:", error);
    return { success: false, error: "Failed to add to cart" };
  }
}

/**
 * Update item quantity in cart
 */
export async function updateCartItem(productId, quantity) {
  try {
    const { appUser } = await requireAppUser();

    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    const cart = await getOrCreateCart(appUser.id);

    const item = await prisma.orderItem.findFirst({
      where: {
        orderId: cart.id,
        productId,
      },
    });

    if (!item) {
      return { success: false, error: "Item not found in cart" };
    }

    const lineTotal = quantity * item.unitPrice;

    await prisma.orderItem.update({
      where: { id: item.id },
      data: {
        quantity,
        total: lineTotal,
      },
    });

    await recalculateOrderTotals(cart.id);

    revalidatePath("/cart");

    return { success: true };
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    console.error("updateCartItem error:", error);
    return { success: false, error: "Failed to update cart item" };
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(productId) {
  try {
    const { appUser } = await requireAppUser();

    const cart = await getOrCreateCart(appUser.id);

    const item = await prisma.orderItem.findFirst({
      where: {
        orderId: cart.id,
        productId,
      },
    });

    if (!item) {
      return { success: false, error: "Item not found in cart" };
    }

    await prisma.orderItem.delete({
      where: { id: item.id },
    });

    await recalculateOrderTotals(cart.id);

    revalidatePath("/cart");

    return { success: true };
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    console.error("removeFromCart error:", error);
    return { success: false, error: "Failed to remove from cart" };
  }
}

/**
 * Clear all items from cart
 */
export async function clearCart() {
  try {
    const { appUser } = await requireAppUser();

    const cart = await prisma.order.findFirst({
      where: {
        userId: appUser.id,
        status: "DRAFT",
      },
    });

    if (!cart) {
      return { success: true };
    }

    // Delete all items
    await prisma.orderItem.deleteMany({
      where: { orderId: cart.id },
    });

    // Reset totals
    await prisma.order.update({
      where: { id: cart.id },
      data: {
        subtotal: 0,
        total: 0,
      },
    });

    revalidatePath("/cart");

    return { success: true };
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    console.error("clearCart error:", error);
    return { success: false, error: "Failed to clear cart" };
  }
}

