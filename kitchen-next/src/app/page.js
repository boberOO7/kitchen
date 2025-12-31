import { getProducts } from "@/data/products-db";
import HomeContent from "./HomeContent";

export default async function Home() {
  const products = await getProducts();
  
  return <HomeContent products={products} />;
}
