import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const ANONYMOUS_CART_COOKIE = "sky_cart_id";

/**
 * Merge anonymous cart into user cart after login
 */
async function mergeAnonymousCartInRoute(userId, anonymousCartId) {
  if (!anonymousCartId) return;

  try {
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
      return;
    }

    // Find user cart
    let userCart = await prisma.order.findFirst({
      where: {
        userId,
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
          userId,
          anonymousCartId: null,
        },
      });
      return;
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
  } catch (error) {
    console.error("Failed to merge anonymous cart:", error);
  }
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Support both "next" and "redirect" parameters
  const redirectTo = searchParams.get("redirect") ?? searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Upsert user into Prisma User table
      try {
        const { appUser } = await requireAppUser();
        
        // Merge anonymous cart if exists
        const cookieStore = await cookies();
        const anonymousCartId = cookieStore.get(ANONYMOUS_CART_COOKIE)?.value;
        
        if (anonymousCartId && appUser) {
          await mergeAnonymousCartInRoute(appUser.id, anonymousCartId);
          // Clear the cookie
          cookieStore.delete(ANONYMOUS_CART_COOKIE);
        }
      } catch (e) {
        console.error("Failed to upsert user or merge cart:", e);
      }

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Redirect to home on error or missing code
  return NextResponse.redirect(`${origin}/`);
}

