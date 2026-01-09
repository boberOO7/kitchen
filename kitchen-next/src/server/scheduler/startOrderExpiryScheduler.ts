import { expirePendingOrders } from "@/server/orders/expirePendingOrders";

// Global flag to ensure scheduler runs only once per process
const globalForScheduler = globalThis as typeof globalThis & {
  __orderExpirySchedulerStarted?: boolean;
};

const INTERVAL_MS = 60_000; // 60 seconds

/**
 * Starts the in-app order expiry scheduler.
 * 
 * This scheduler:
 * - Runs only once per Node.js process (guarded by global flag)
 * - Calls expirePendingOrders() immediately on start
 * - Then calls it every 60 seconds via setInterval
 * 
 * This is useful for localhost/single-server deployments.
 * For production with multiple instances, consider using a proper
 * job scheduler (pg_cron, Vercel Cron, etc.)
 */
export function startOrderExpiryScheduler(): void {
  // Prevent multiple schedulers in the same process
  if (globalForScheduler.__orderExpirySchedulerStarted) {
    return;
  }
  
  globalForScheduler.__orderExpirySchedulerStarted = true;
  
  console.log("[OrderExpiryScheduler] Starting scheduler (interval: 60s)");
  
  // Run immediately once
  runExpiration();
  
  // Then run every 60 seconds
  setInterval(runExpiration, INTERVAL_MS);
}

async function runExpiration(): Promise<void> {
  try {
    const count = await expirePendingOrders();
    if (count > 0) {
      console.log(`[OrderExpiryScheduler] Expired ${count} order(s)`);
    }
  } catch (error) {
    console.error("[OrderExpiryScheduler] Error expiring orders:", error);
  }
}

