import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  monoVerifyWebhook,
  mapMonoStatusToPaymentStatus,
  shouldUpdateOrderToPaid,
  shouldUpdateOrderToCancelled,
  type MonoWebhookPayload,
} from "@/lib/monobank";
import { PaymentProvider, OrderStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Disable body parsing - we need raw body for signature verification
// ─────────────────────────────────────────────────────────────────────────────

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/webhooks/monobank
// Some payment providers ping the webhook URL to verify it's alive
// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({ status: "ok" });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhooks/monobank
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  console.log("\n" + "=".repeat(60));
  console.log("🟢 MONOBANK WEBHOOK RECEIVED!");
  console.log("=".repeat(60));
  
  try {
    // 1. Read raw body for signature verification
    const rawBody = new Uint8Array(await request.arrayBuffer());
    console.log("✅ Raw body received, length:", rawBody.length);

    // 2. Get X-Sign header
    const xSign = request.headers.get("X-Sign");
    if (!xSign) {
      console.error("❌ Webhook missing X-Sign header");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }
    console.log("✅ X-Sign header present");

    // 3. Verify signature
    console.log("🔐 Verifying signature...");
    const isValid = await monoVerifyWebhook(rawBody, xSign);
    if (!isValid) {
      console.error("❌ Webhook signature verification failed");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
    console.log("✅ Signature verified");

    // 4. Parse webhook payload
    const bodyText = new TextDecoder().decode(rawBody);
    const payload: MonoWebhookPayload = JSON.parse(bodyText);

    console.log("\n📦 Webhook Payload:");
    console.log("   Invoice ID:", payload.invoiceId);
    console.log("   Status:", payload.status);
    console.log("   Amount:", payload.amount);
    console.log("   Reference:", payload.reference);

    // 5. Find Payment by invoiceId (providerRef)
    const payment = await prisma.payment.findFirst({
      where: {
        provider: PaymentProvider.MONOBANK,
        providerRef: payload.invoiceId,
      },
      include: {
        order: true,
      },
    });

    if (!payment) {
      console.error(`Payment not found for invoiceId: ${payload.invoiceId}`);
      // Return 200 to prevent retries for unknown invoices
      return NextResponse.json({ status: "ignored" });
    }

    // 6. Map monobank status to our PaymentStatus
    const newPaymentStatus = mapMonoStatusToPaymentStatus(payload.status);

    // 7. Update Payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newPaymentStatus,
        raw: payload as object,
        webhookEventId: `${payload.invoiceId}_${payload.status}_${Date.now()}`,
      },
    });

    // 8. Update Order status if needed
    if (shouldUpdateOrderToPaid(newPaymentStatus)) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: OrderStatus.PAID,
        },
      });
      console.log("🎉 Order", payment.orderId, "marked as PAID!");
    } else if (shouldUpdateOrderToCancelled(newPaymentStatus)) {
      // Only cancel if order is still pending payment
      if (payment.order.status === OrderStatus.PENDING_PAYMENT) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: OrderStatus.CANCELLED,
          },
        });
        console.log("❌ Order", payment.orderId, "marked as CANCELLED");
      }
    }

    console.log("=".repeat(60) + "\n");
    
    // 9. Return success quickly
    return NextResponse.json({ status: "ok" });

  } catch (error) {
    console.error("Webhook processing error:", error);
    // Return 200 to prevent retries on parse errors
    // Monobank will retry on 4xx/5xx
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

