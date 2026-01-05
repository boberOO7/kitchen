"use server";

import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Format cart data for client consumption
 * Note: All prices are stored in minor units (cents/kopeks)
 */
function formatCart(cart) {
  if (!cart) return null;
  
  const items = cart.items || [];
  const subtotal = items.reduce((sum, item) => sum + item.totalMinor, 0);
  
  return {
    id: cart.id,
    subtotal, // In minor units
    total: subtotal, // In minor units. Can add shipping/discounts later
    currency: cart.currency,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      unitPrice: item.unitPriceMinor, // In minor units
      quantity: item.quantity,
      total: item.totalMinor, // In minor units
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            imageKey: item.product.imageKey,
            price: item.product.priceMinor, // In minor units
          }
        : null,
    })),
  };
}

/**
 * Get existing DRAFT order (cart) for current user - READ ONLY
 * Does NOT create a new cart if none exists
 */
async function getExistingCart(userId) {
  return await prisma.order.findFirst({
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
}

/**
 * Get or create DRAFT order (cart) for current user
 * Only call this when actually adding items to cart!
 */
async function getOrCreateCart(userId) {
  // Try to find existing DRAFT order
  let cart = await getExistingCart(userId);

  if (cart) {
    return cart;
  }

  // No DRAFT order found - create a new cart
  cart = await prisma.order.create({
    data: {
      userId,
      status: "DRAFT",
      currency: "USD",
      subtotalMinor: 0,
      totalMinor: 0,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  return cart;
}

/**
 * Fetch fresh cart with all items and return formatted
 */
async function getFreshCart(userId) {
  const cart = await prisma.order.findFirst({
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
  return formatCart(cart);
}

/**
 * Get current user's cart with items and products
 * Does NOT create a new cart if none exists - returns null cart
 */
export async function getCart() {
  try {
    const { appUser } = await requireAppUser();
    const cart = await getExistingCart(appUser.id);

    return {
      success: true,
      cart: formatCart(cart), // Will return null if no cart exists
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
 * Returns updated cart for optimistic update reconciliation
 */
export async function addToCart(productId, quantity = 1) {
  try {
    const { appUser } = await requireAppUser();

    // Get product info
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      return { success: false, error: "Product not found", cart: null };
    }

    // Get or create cart
    const cart = await getOrCreateCart(appUser.id);

    // Check if item already exists in cart (use cart.items we already have)
    const existingItem = cart.items.find((item) => item.productId === productId);

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      const lineTotal = newQuantity * existingItem.unitPriceMinor;

      await prisma.orderItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          totalMinor: lineTotal,
        },
      });
    } else {
      // Create new item (prices in minor units)
      const lineTotal = quantity * product.priceMinor;

      await prisma.orderItem.create({
        data: {
          orderId: cart.id,
          productId,
          name: product.name,
          unitPriceMinor: product.priceMinor,
          quantity,
          totalMinor: lineTotal,
        },
      });
    }

    // Calculate new totals from updated items
    const updatedCart = await getFreshCart(appUser.id);
    
    // Update order totals (in minor units)
    await prisma.order.update({
      where: { id: cart.id },
      data: {
        subtotalMinor: updatedCart.subtotal,
        totalMinor: updatedCart.total,
      },
    });

    revalidatePath("/cart");

    return { success: true, cart: updatedCart };
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED", cart: null };
    }
    console.error("addToCart error:", error);
    return { success: false, error: "Failed to add to cart", cart: null };
  }
}

/**
 * Update item quantity in cart (fire-and-forget style)
 * Just updates the DB, no cart return - client handles optimistic updates
 */
export async function updateCartItem(productId, quantity) {
  try {
    const { appUser } = await requireAppUser();

    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    // Single query: update item and get unitPrice for calculating line total
    const item = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: appUser.id,
          status: "DRAFT",
        },
      },
    });

    if (!item) {
      return { success: false, error: "Item not found" };
    }

    const lineTotal = quantity * item.unitPriceMinor;

    // Update item
    await prisma.orderItem.update({
      where: { id: item.id },
      data: {
        quantity,
        totalMinor: lineTotal,
      },
    });

    // Update order totals (recalculate from all items, in minor units)
    const allItems = await prisma.orderItem.findMany({
      where: { orderId: item.orderId },
    });
    const subtotal = allItems.reduce((sum, i) => sum + i.totalMinor, 0);
    
    await prisma.order.update({
      where: { id: item.orderId },
      data: { subtotalMinor: subtotal, totalMinor: subtotal },
    });

    return { success: true };
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    console.error("updateCartItem error:", error);
    return { success: false, error: "Failed to update" };
  }
}

/**
 * Remove item from cart (fire-and-forget style)
 * Just deletes from DB, no cart return - client handles optimistic updates
 */
export async function removeFromCart(productId) {
  try {
    const { appUser } = await requireAppUser();

    // Find and delete item in one flow
    const item = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: appUser.id,
          status: "DRAFT",
        },
      },
    });

    if (!item) {
      return { success: false, error: "Item not found" };
    }

    await prisma.orderItem.delete({
      where: { id: item.id },
    });

    // Update order totals (in minor units)
    const remainingItems = await prisma.orderItem.findMany({
      where: { orderId: item.orderId },
    });
    const subtotal = remainingItems.reduce((sum, i) => sum + i.totalMinor, 0);
    
    await prisma.order.update({
      where: { id: item.orderId },
      data: { subtotalMinor: subtotal, totalMinor: subtotal },
    });

    return { success: true };
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    console.error("removeFromCart error:", error);
    return { success: false, error: "Failed to remove" };
  }
}

/**
 * Clear all items from cart
 * Returns updated (empty) cart for optimistic update reconciliation
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
      return { 
        success: true, 
        cart: {
          id: null,
          subtotal: 0,
          total: 0,
          currency: "USD",
          itemCount: 0,
          items: [],
        }
      };
    }

    // Delete all items
    await prisma.orderItem.deleteMany({
      where: { orderId: cart.id },
    });

    // Reset totals
    await prisma.order.update({
      where: { id: cart.id },
      data: {
        subtotalMinor: 0,
        totalMinor: 0,
      },
    });

    revalidatePath("/cart");

    return { 
      success: true, 
      cart: {
        id: cart.id,
        subtotal: 0,
        total: 0,
        currency: cart.currency,
        itemCount: 0,
        items: [],
      }
    };
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED", cart: null };
    }
    console.error("clearCart error:", error);
    return { success: false, error: "Failed to clear cart", cart: null };
  }
}
