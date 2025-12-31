import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_SEED,
  ssl: true,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SKY_PRODUCTS = [
  {
    sku: "sky-linea",
    name: "SKY Linea",
    description: "Чисті лінії, матові фасади, тиха фурнітура.",
    price: 5900,
    currency: "USD",
    isActive: true,
    imageKey: "kitchens/sky-linea.jpg",
  },
  {
    sku: "sky-nero",
    name: "SKY Nero",
    description: "Глибокий графіт з акцентами металу.",
    price: 7200,
    currency: "USD",
    isActive: true,
    imageKey: "kitchens/sky-nero.jpg",
  },
  {
    sku: "sky-oak",
    name: "SKY Oak",
    description: "Теплий шпон, мінімум деталей, максимум тактильності.",
    price: 6400,
    currency: "USD",
    isActive: true,
    imageKey: "kitchens/sky-oak.jpg",
  },
  {
    sku: "sky-ice",
    name: "SKY Ice",
    description: "Світла кухня з каменем та акуратною геометрією.",
    price: 6100,
    currency: "USD",
    isActive: true,
    imageKey: "kitchens/sky-ice.jpg",
  },
  {
    sku: "sky-studio",
    name: "SKY Studio",
    description: "Компактні модулі для студій та апартаментів.",
    price: 4200,
    currency: "USD",
    isActive: true,
    imageKey: "kitchens/sky-studio.jpg",
  },
  {
    sku: "sky-signature",
    name: "SKY Signature",
    description: "Преміум-композиція з індивідуальними матеріалами.",
    price: 9800,
    currency: "USD",
    isActive: true,
    imageKey: "kitchens/sky-signature.jpg",
  },
];

async function main() {
  for (const p of SKY_PRODUCTS) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: p,
      create: p,
    });
  }

  console.log(`Seeded ${SKY_PRODUCTS.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
