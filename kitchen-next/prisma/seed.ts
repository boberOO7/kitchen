import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_SEED,
  ssl: true,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Prices are stored in minor units (cents for USD, kopeks for UAH)
// Example: 590000 cents = $5,900
const SKY_PRODUCTS = [
  {
    sku: "sky-linea",
    name: "SKY Linea",
    description: "Чисті лінії, матові фасади, тиха фурнітура.",
    priceMinor: 590000, // $5,900
    currency: "USD",
    isActive: true,
    imageKey: "kitchens/sky-linea.jpg",
  },
  {
    sku: "sky-nero",
    name: "SKY Nero",
    description: "Глибокий графіт з акцентами металу.",
    priceMinor: 720000, // $7,200
    currency: "USD",
    isActive: true,
    imageKey: "kitchens/sky-nero.jpg",
  },
  {
    sku: "sky-oak",
    name: "SKY Oak",
    description: "Теплий шпон, мінімум деталей, максимум тактильності.",
    priceMinor: 640000, // $6,400
    currency: "USD",
    isActive: true,
    imageKey: "kitchens/sky-oak.jpg",
  },
  {
    sku: "sky-ice",
    name: "SKY Ice",
    description: "Світла кухня з каменем та акуратною геометрією.",
    priceMinor: 610000, // $6,100
    currency: "USD",
    isActive: true,
    imageKey: "kitchens/sky-ice.jpg",
  },
  {
    sku: "sky-studio",
    name: "SKY Studio",
    description: "Компактні модулі для студій та апартаментів.",
    priceMinor: 420000, // $4,200
    currency: "USD",
    isActive: true,
    imageKey: "kitchens/sky-studio.jpg",
  },
  {
    sku: "sky-signature",
    name: "SKY Signature",
    description: "Преміум-композиція з індивідуальними матеріалами.",
    priceMinor: 980000, // $9,800
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
