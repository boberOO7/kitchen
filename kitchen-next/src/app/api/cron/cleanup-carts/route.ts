import { NextRequest, NextResponse } from "next/server";
import { cleanupAnonymousCarts } from "@/server/orders/cleanupAnonymousCarts";

// Secret key to protect the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Cleanup old anonymous carts
 * Called by cron job (Vercel Cron, external service, or manually)
 * 
 * Example Vercel cron config in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-carts",
 *     "schedule": "0 3 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (skip in development)
  if (process.env.NODE_ENV === "production") {
    const authHeader = request.headers.get("authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");
    
    // Also check for Vercel cron header
    const vercelCronHeader = request.headers.get("x-vercel-cron");
    
    if (!vercelCronHeader && (!CRON_SECRET || providedSecret !== CRON_SECRET)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  console.log("\n⏰ Cron: Starting cart cleanup...");

  const result = await cleanupAnonymousCarts();

  return NextResponse.json({
    success: true,
    message: `Cleaned up ${result.deleted} old anonymous carts`,
    ...result,
  });
}

