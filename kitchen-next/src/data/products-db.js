import "server-only";
import { prisma } from "@/lib/prisma";
import { getProductImageUrl } from "@/lib/storage";

/**
 * Fetch all active products from database
 * Maps DB fields to UI-expected format
 */
export async function getProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  // Debug: log first product to see imageKey value
  if (products.length > 0) {
    console.log("[products-db] First product imageKey:", products[0].imageKey);
    console.log("[products-db] SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30));
  }

  return products.map((p) => ({
    slug: p.sku,
    name: p.name,
    tagline: p.description || "",
    priceFrom: p.price,
    // highlights not stored in DB, using empty array
    highlights: [],
    image: getProductImageUrl(p.imageKey) || "/placeholder.jpg",
  }));
}

/**
 * Fetch a single product by SKU
 */
export async function getProductBySku(sku) {
  const product = await prisma.product.findUnique({
    where: { sku },
  });

  if (!product) return null;

  return {
    slug: product.sku,
    name: product.name,
    tagline: product.description || "",
    priceFrom: product.price,
    highlights: [],
    image: getProductImageUrl(product.imageKey),
  };
}

