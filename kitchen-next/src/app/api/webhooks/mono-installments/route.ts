import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyInstallmentWebhookSignature,
  mapMonoInstallmentStatus,
  shouldUpdateOrderToPaidFromInstallment,
  extractOrderIdFromCallback,
  extractApplicationIdFromCallback,
  extractStatusFromCallback,
  type InstallmentCallbackPayload,
} from "@/lib/monobank-installments";
import { OrderStatus, InstallmentStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Runtime config
// ─────────────────────────────────────────────────────────────────────────────

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/webhooks/mono-installments
// Health check endpoint
// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({ status: "ok", service: "mono-installments-webhook" });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhooks/mono-installments
// Webhook handler for Monobank installments callbacks
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  console.log("\n" + "=".repeat(60));
  console.log("🟢 MONO INSTALLMENTS WEBHOOK RECEIVED!");
  console.log("=".repeat(60));

  try {
    // 1. Read raw body for signature verification
    const rawBody = await request.text();
    console.log("✅ Raw body received, length:", rawBody.length);

    // 2. Get signature header (try multiple possible header names)
    const signature = 
      request.headers.get("signature") || 
      request.headers.get("Signature") ||
      request.headers.get("X-Sign") || 
      request.headers.get("x-sign");
    if (!signature) {
      console.error("❌ Webhook missing signature header");
      console.error("   Available headers:", Object.fromEntries(request.headers.entries()));
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }
    console.log("✅ Signature header present");

    // 3. Verify signature
    const secret = process.env.MONO_CHAST_SECRET;
    if (!secret) {
      console.error("❌ MONO_CHAST_SECRET not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    console.log("🔐 Verifying signature...");
    const isValid = verifyInstallmentWebhookSignature(rawBody, signature, secret);
    if (!isValid) {
      console.error("❌ Webhook signature verification failed");
      // In development, log more details
      if (process.env.NODE_ENV === "development") {
        console.log("   Received signature:", signature);
        console.log("   Body:", rawBody.substring(0, 200));
      }
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
    console.log("✅ Signature verified");

    // 4. Parse webhook payload
    let payload: InstallmentCallbackPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error("❌ Failed to parse webhook body:", e);
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Extract data from callback payload
    // Note: Monobank sends `order_id` which is THEIR ID (stored as monoApplicationId)
    //       and `store_order_id` which is OUR internal order ID (if included)
    const monoOrderId = (payload as Record<string, unknown>).order_id as string | undefined;
    const storeOrderId = (payload as Record<string, unknown>).store_order_id as string | undefined;
    const applicationId = extractApplicationIdFromCallback(payload);
    const status = extractStatusFromCallback(payload);
    const monthlyAmount = payload.monthly_amount || payload.monthlyAmount;
    const failureReason = payload.failure_reason || payload.failureReason;

    console.log("\n📦 Webhook Payload (raw):", JSON.stringify(payload, null, 2));
    console.log("\n📦 Extracted data:");
    console.log("   Mono order_id (their ID):", monoOrderId);
    console.log("   store_order_id (our ID):", storeOrderId);
    console.log("   Application ID:", applicationId);
    console.log("   Status:", status);
    console.log("   Monthly Amount:", monthlyAmount);
    console.log("   Failure Reason:", failureReason || "none");

    // 5. Find installment application
    // Search by: monoApplicationId (matches Mono's order_id) OR our internal orderId
    let installmentApp = await prisma.installmentApplication.findFirst({
      where: {
        OR: [
          // Mono's order_id matches our monoApplicationId
          ...(monoOrderId ? [{ monoApplicationId: monoOrderId }] : []),
          // Their store_order_id matches our internal orderId
          ...(storeOrderId ? [{ orderId: storeOrderId }] : []),
          // Fallback: application_id field
          ...(applicationId ? [{ monoApplicationId: applicationId }] : []),
        ],
      },
      include: {
        order: true,
      },
    });

    if (!installmentApp) {
      console.error(`Installment application not found for monoOrderId: ${monoOrderId}, storeOrderId: ${storeOrderId}`);
      // Return 200 to prevent retries for unknown applications
      return NextResponse.json({ status: "ignored", reason: "application not found" });
    }

    console.log("✅ Found installment application:", installmentApp.id);

    // 6. Check for idempotency - don't process if already in terminal state
    const terminalStatuses = [
      InstallmentStatus.APPROVED,
      InstallmentStatus.DECLINED,
      InstallmentStatus.CANCELED,
      InstallmentStatus.EXPIRED,
    ];

    const newStatus = mapMonoInstallmentStatus(status);
    
    // If current status is terminal and we're receiving the same status, skip
    if (terminalStatuses.includes(installmentApp.status)) {
      if (installmentApp.status === newStatus) {
        console.log("⏭️ Duplicate webhook for terminal status, skipping");
        return NextResponse.json({ status: "duplicate" });
      }
      // If different terminal status, log warning but don't update
      console.warn(`⚠️ Received ${newStatus} but application already in ${installmentApp.status}`);
      return NextResponse.json({ status: "ignored", reason: "already in terminal state" });
    }

    // 7. Update installment application
    installmentApp = await prisma.installmentApplication.update({
      where: { id: installmentApp.id },
      data: {
        status: newStatus,
        monoApplicationId: applicationId || installmentApp.monoApplicationId,
        monthlyAmount: monthlyAmount || installmentApp.monthlyAmount,
        rawCallback: payload as object,
      },
      include: {
        order: true,
      },
    });

    console.log("✅ Installment status updated to:", newStatus);

    // 8. Update Order status if needed
    if (shouldUpdateOrderToPaidFromInstallment(newStatus)) {
      await prisma.order.update({
        where: { id: installmentApp.orderId },
        data: {
          status: OrderStatus.PAID,
        },
      });
      console.log("🎉 Order", installmentApp.orderId, "marked as PAID!");
    } else if (newStatus === InstallmentStatus.DECLINED || 
               newStatus === InstallmentStatus.CANCELED ||
               newStatus === InstallmentStatus.EXPIRED) {
      // Keep order in PENDING_PAYMENT for user to retry with different method
      console.log(`⚠️ Installment ${newStatus} for order ${installmentApp.orderId} - order stays in PENDING_PAYMENT`);
    }

    console.log("=".repeat(60) + "\n");

    // 9. Return success quickly
    return NextResponse.json({ status: "ok" });

  } catch (error) {
    console.error("Webhook processing error:", error);
    // Return 500 so Monobank retries
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

