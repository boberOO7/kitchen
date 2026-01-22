import { getProducts } from "@/data/products-db";
import CatalogContent from "../CatalogContent";

export const metadata = {
  title: "Кухні",
  description: "Колекція кухонь SKYY — люксовий мінімалізм для сучасного дому.",
};

export default async function KitchensCatalogPage() {
  const products = await getProducts();
  
  return <CatalogContent products={products} category="kitchens" />;
}
