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

  return products.map((p) => ({
    id: p.id,
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

/**
 * Fetch a single product by ID
 */
export async function getProductById(id) {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product || !product.isActive) return null;

  return {
    id: product.id,
    slug: product.sku,
    name: product.name,
    tagline: product.description || "",
    price: product.price,
    image: getProductImageUrl(product.imageKey) || "/placeholder.jpg",
  };
}

