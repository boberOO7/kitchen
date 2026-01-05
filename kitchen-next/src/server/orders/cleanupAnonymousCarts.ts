import { prisma } from "@/lib/prisma";

// Anonymous carts older than this will be deleted (30 days)
const ANONYMOUS_CART_TTL_DAYS = 30;

/**
 * Delete anonymous DRAFT orders (carts) that haven't been updated in TTL_DAYS
 * Should be called periodically (e.g., daily cron job)
 */
export async function cleanupAnonymousCarts(): Promise<{
  deleted: number;
  errors: number;
}> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - ANONYMOUS_CART_TTL_DAYS);

  console.log(`\n🧹 Cleaning up anonymous carts older than ${cutoffDate.toISOString()}`);

  try {
    // Find old anonymous DRAFT orders
    const oldCarts = await prisma.order.findMany({
      where: {
        status: "DRAFT",
        anonymousCartId: { not: null },
        updatedAt: { lt: cutoffDate },
      },
      select: {
        id: true,
        anonymousCartId: true,
        updatedAt: true,
      },
    });

    if (oldCarts.length === 0) {
      console.log("   No old anonymous carts found.");
      return { deleted: 0, errors: 0 };
    }

    console.log(`   Found ${oldCarts.length} old anonymous carts to delete.`);

    let deleted = 0;
    let errors = 0;

    for (const cart of oldCarts) {
      try {
        // Delete items first (cascade should handle this, but being explicit)
        await prisma.orderItem.deleteMany({
          where: { orderId: cart.id },
        });

        // Delete the order
        await prisma.order.delete({
          where: { id: cart.id },
        });

        deleted++;
        console.log(`   ✅ Deleted cart ${cart.id} (last updated: ${cart.updatedAt.toISOString()})`);
      } catch (error) {
        errors++;
        console.error(`   ❌ Failed to delete cart ${cart.id}:`, error);
      }
    }

    console.log(`\n🧹 Cleanup complete: ${deleted} deleted, ${errors} errors.`);

    return { deleted, errors };
  } catch (error) {
    console.error("cleanupAnonymousCarts error:", error);
    return { deleted: 0, errors: 1 };
  }
}

