"use server";

import { prisma } from "@/lib/prisma";
import { getAppUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// Cookie name for anonymous cart ID
const ANONYMOUS_CART_COOKIE = "sky_cart_id";
// Cookie max age: 30 days
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

/**
 * Generate a UUID for anonymous cart
 */
function generateCartId() {
  return crypto.randomUUID();
}

/**
 * Get or create anonymous cart ID from cookie
 */
async function getOrCreateAnonymousCartId() {
  const cookieStore = await cookies();
  let cartId = cookieStore.get(ANONYMOUS_CART_COOKIE)?.value;

  if (!cartId) {
    cartId = generateCartId();
    cookieStore.set(ANONYMOUS_CART_COOKIE, cartId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  }

  return cartId;
}

/**
 * Get anonymous cart ID from cookie (read only, don't create)
 */
async function getAnonymousCartId() {
  const cookieStore = await cookies();
  return cookieStore.get(ANONYMOUS_CART_COOKIE)?.value || null;
}

/**
 * Clear anonymous cart cookie (after merge or checkout)
 */
async function clearAnonymousCartCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ANONYMOUS_CART_COOKIE);
}

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
 * Get existing DRAFT order (cart) for user or anonymous
 * Does NOT create a new cart if none exists
 */
async function getExistingCart(userId, anonymousCartId) {
  // Try user cart first if logged in
  if (userId) {
    const userCart = await prisma.order.findFirst({
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
    if (userCart) return userCart;
  }

  // Try anonymous cart
  if (anonymousCartId) {
    return await prisma.order.findFirst({
      where: {
        anonymousCartId,
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

  return null;
}

/**
 * Get or create DRAFT order (cart) for user or anonymous
 * Only call this when actually adding items to cart!
 */
async function getOrCreateCart(userId, anonymousCartId) {
  // Try to find existing cart
  let cart = await getExistingCart(userId, anonymousCartId);

  if (cart) {
    return cart;
  }

  // No cart found - create a new one
  const data = {
    status: "DRAFT",
    currency: "USD",
    subtotalMinor: 0,
    totalMinor: 0,
  };

  if (userId) {
    data.userId = userId;
  } else if (anonymousCartId) {
    data.anonymousCartId = anonymousCartId;
  } else {
    throw new Error("Either userId or anonymousCartId is required");
  }

  cart = await prisma.order.create({
    data,
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
async function getFreshCart(userId, anonymousCartId) {
  const whereClause = userId
    ? { userId, status: "DRAFT" }
    : { anonymousCartId, status: "DRAFT" };

  const cart = await prisma.order.findFirst({
    where: whereClause,
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
 * Merge anonymous cart into user cart (called after login)
 */
export async function mergeAnonymousCart() {
  try {
    const { appUser } = await getAppUser();
    if (!appUser) {
      return { success: false, error: "Not logged in" };
    }

    const anonymousCartId = await getAnonymousCartId();
    if (!anonymousCartId) {
      return { success: true, merged: false }; // No anonymous cart to merge
    }

    // Find anonymous cart
    const anonymousCart = await prisma.order.findFirst({
      where: {
        anonymousCartId,
        status: "DRAFT",
      },
      include: {
        items: true,
      },
    });

    if (!anonymousCart || anonymousCart.items.length === 0) {
      // Clear the cookie anyway
      await clearAnonymousCartCookie();
      return { success: true, merged: false };
    }

    // Find or create user cart
    let userCart = await prisma.order.findFirst({
      where: {
        userId: appUser.id,
        status: "DRAFT",
      },
      include: {
        items: true,
      },
    });

    if (!userCart) {
      // Just assign the anonymous cart to the user
      await prisma.order.update({
        where: { id: anonymousCart.id },
        data: {
          userId: appUser.id,
          anonymousCartId: null,
        },
      });
      await clearAnonymousCartCookie();
      return { success: true, merged: true };
    }

    // Merge items from anonymous cart into user cart
    for (const anonItem of anonymousCart.items) {
      const existingItem = userCart.items.find(
        (item) => item.productId === anonItem.productId
      );

      if (existingItem) {
        // Increase quantity
        const newQuantity = existingItem.quantity + anonItem.quantity;
        const lineTotal = newQuantity * existingItem.unitPriceMinor;
        await prisma.orderItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQuantity,
            totalMinor: lineTotal,
          },
        });
      } else {
        // Copy item to user cart
        await prisma.orderItem.create({
          data: {
            orderId: userCart.id,
            productId: anonItem.productId,
            name: anonItem.name,
            unitPriceMinor: anonItem.unitPriceMinor,
            quantity: anonItem.quantity,
            totalMinor: anonItem.totalMinor,
          },
        });
      }
    }

    // Recalculate user cart totals
    const allItems = await prisma.orderItem.findMany({
      where: { orderId: userCart.id },
    });
    const subtotal = allItems.reduce((sum, i) => sum + i.totalMinor, 0);
    await prisma.order.update({
      where: { id: userCart.id },
      data: { subtotalMinor: subtotal, totalMinor: subtotal },
    });

    // Delete anonymous cart
    await prisma.order.delete({
      where: { id: anonymousCart.id },
    });

    await clearAnonymousCartCookie();

    return { success: true, merged: true };
  } catch (error) {
    console.error("mergeAnonymousCart error:", error);
    return { success: false, error: "Failed to merge cart" };
  }
}

/**
 * Get current cart (for logged in user or anonymous)
 * Does NOT create a new cart if none exists - returns null cart
 */
export async function getCart() {
  try {
    const { appUser } = await getAppUser();
    const anonymousCartId = await getAnonymousCartId();

    const cart = await getExistingCart(appUser?.id, anonymousCartId);

    return {
      success: true,
      cart: formatCart(cart),
      isAuthenticated: !!appUser,
    };
  } catch (error) {
    console.error("getCart error:", error);
    return { success: false, error: "Failed to get cart", cart: null };
  }
}

/**
 * Add product to cart (or increase quantity if already exists)
 * Works for both logged in users and anonymous
 * Returns updated cart for optimistic update reconciliation
 */
export async function addToCart(productId, quantity = 1) {
  try {
    const { appUser } = await getAppUser();
    const anonymousCartId = appUser ? null : await getOrCreateAnonymousCartId();

    // Get product info
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      return { success: false, error: "Product not found", cart: null };
    }

    // Get or create cart
    const cart = await getOrCreateCart(appUser?.id, anonymousCartId);

    // Check if item already exists in cart
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
      // Create new item
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
    const updatedCart = await getFreshCart(appUser?.id, anonymousCartId);
    
    // Update order totals
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
    console.error("addToCart error:", error);
    return { success: false, error: "Failed to add to cart", cart: null };
  }
}

/**
 * Update item quantity in cart (fire-and-forget style)
 * Works for both logged in users and anonymous
 */
export async function updateCartItem(productId, quantity) {
  try {
    const { appUser } = await getAppUser();
    const anonymousCartId = await getAnonymousCartId();

    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    // Build where clause for finding item
    const whereClause = {
      productId,
      order: {
        status: "DRAFT",
      },
    };

    if (appUser) {
      whereClause.order.userId = appUser.id;
    } else if (anonymousCartId) {
      whereClause.order.anonymousCartId = anonymousCartId;
    } else {
      return { success: false, error: "No cart found" };
    }

    const item = await prisma.orderItem.findFirst({
      where: whereClause,
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

    // Update order totals
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
    console.error("updateCartItem error:", error);
    return { success: false, error: "Failed to update" };
  }
}

/**
 * Remove item from cart (fire-and-forget style)
 * Works for both logged in users and anonymous
 */
export async function removeFromCart(productId) {
  try {
    const { appUser } = await getAppUser();
    const anonymousCartId = await getAnonymousCartId();

    // Build where clause
    const whereClause = {
      productId,
      order: {
        status: "DRAFT",
      },
    };

    if (appUser) {
      whereClause.order.userId = appUser.id;
    } else if (anonymousCartId) {
      whereClause.order.anonymousCartId = anonymousCartId;
    } else {
      return { success: false, error: "No cart found" };
    }

    const item = await prisma.orderItem.findFirst({
      where: whereClause,
    });

    if (!item) {
      return { success: false, error: "Item not found" };
    }

    await prisma.orderItem.delete({
      where: { id: item.id },
    });

    // Update order totals
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
    console.error("removeFromCart error:", error);
    return { success: false, error: "Failed to remove" };
  }
}

/**
 * Clear all items from cart
 * Works for both logged in users and anonymous
 */
export async function clearCart() {
  try {
    const { appUser } = await getAppUser();
    const anonymousCartId = await getAnonymousCartId();

    const whereClause = appUser
      ? { userId: appUser.id, status: "DRAFT" }
      : anonymousCartId
        ? { anonymousCartId, status: "DRAFT" }
        : null;

    if (!whereClause) {
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

    const cart = await prisma.order.findFirst({
      where: whereClause,
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
    console.error("clearCart error:", error);
    return { success: false, error: "Failed to clear cart", cart: null };
  }
}
