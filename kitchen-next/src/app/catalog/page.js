import { getProducts } from "@/data/products-db";
import CatalogContent from "./CatalogContent";

export default async function CatalogPage() {
  const products = await getProducts();
  
  return <CatalogContent products={products} />;
}
