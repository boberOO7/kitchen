import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis;

function makeClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL. Add it to kitchen-next/.env (copy from env.sample).");
  }

  // Create pg Pool with SSL config for Supabase
  const pool = new pg.Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Required for Supabase connection
    },
  });

  return new PrismaClient({
    adapter: new PrismaPg({ pool }),
  });
}

export const prisma = globalForPrisma.__prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}
