import { NextResponse } from "next/server";
import { startOrderExpiryScheduler } from "@/server/scheduler/startOrderExpiryScheduler";

// Start scheduler at module load time (runs once per server instance)
startOrderExpiryScheduler();

/**
 * Health check endpoint.
 * Also ensures the order expiry scheduler is running.
 * 
 * GET /api/_internal/health
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
  });
}

