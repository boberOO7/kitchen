import { getProductById, getProducts } from "@/data/products-db";
import ConfiguratorContent from "./ConfiguratorContent";

export const metadata = {
  title: "3D Конфігуратор",
  description: "Оберіть матеріали та подивіться результат в реальному часі",
};

export default async function ConfiguratorPage({ searchParams }) {
  const params = await searchParams;
  const productId = params?.product;
  
  let product = null;
  
  if (productId) {
    product = await getProductById(productId);
  }
  
  // If no product specified or not found, get the first available product
  if (!product) {
    const products = await getProducts();
    if (products.length > 0) {
      product = {
        id: products[0].id,
        name: products[0].name,
        tagline: products[0].tagline,
        price: products[0].priceFrom,
        image: products[0].image,
      };
    }
  }

  return <ConfiguratorContent product={product} />;
}
