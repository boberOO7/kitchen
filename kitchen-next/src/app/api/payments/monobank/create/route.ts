import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import {
  monoCreateInvoice,
  getCurrencyCode,
  type MonoInvoiceCreateRequest,
} from "@/lib/monobank";
import { getProductImageUrl } from "@/lib/storage";
import { PaymentProvider, PaymentStatus, OrderStatus } from "@prisma/client";
import { getOrderExpirationDate } from "@/server/orders/expirePendingOrders";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Get origin URL
// ─────────────────────────────────────────────────────────────────────────────

function getOrigin(request: NextRequest): string {
  // Try origin header first
  const origin = request.headers.get("origin");
  if (origin) return origin;

  // Try x-forwarded headers (Vercel, proxies)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  // Try host header
  const host = request.headers.get("host");
  if (host) {
    const proto = host.includes("localhost") ? "http" : "https";
    return `${proto}://${host}`;
  }

  // Fallback to APP_URL env
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  throw new Error("Could not determine origin URL");
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/monobank/create
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  console.log("\n" + "=".repeat(60));
  console.log("🔵 MONOBANK PAYMENT CREATE - START");
  console.log("=".repeat(60));
  
  try {
    // 1. Authenticate user
    const { appUser } = await requireAppUser();
    console.log("✅ User authenticated:", appUser.id);

    // 2. Parse request body
    const body = await request.json();
    const { orderId } = body;
    console.log("✅ Order ID:", orderId);

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    // 3. Load order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // 4. Verify order belongs to user
    if (order.userId !== appUser.id) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // 5. Validate order status
    if (order.status !== OrderStatus.DRAFT && order.status !== OrderStatus.PENDING_PAYMENT) {
      return NextResponse.json(
        { error: `Cannot create payment for order with status: ${order.status}` },
        { status: 400 }
      );
    }

    // 6. Validate order has items and total
    if (order.items.length === 0) {
      return NextResponse.json(
        { error: "Order has no items" },
        { status: 400 }
      );
    }

    if (order.totalMinor <= 0) {
      return NextResponse.json(
        { error: "Order total must be greater than 0" },
        { status: 400 }
      );
    }

    // 6b. Validate UAH amount is set (exchange rate was fixed)
    if (!order.totalUahMinor || order.totalUahMinor <= 0) {
      return NextResponse.json(
        { error: "UAH amount not calculated. Please try again." },
        { status: 400 }
      );
    }

    // 7. Build monobank invoice request
    const origin = getOrigin(request);
    
    // ⚠️ CRITICAL: Webhook URL must be PUBLIC (ngrok), not localhost!
    const appUrl = process.env.APP_URL;
    const webhookUrl = appUrl 
      ? `${appUrl}/api/webhooks/monobank`
      : `${origin}/api/webhooks/monobank`;
    
    console.log("\n📋 URL Configuration:");
    console.log("   APP_URL env:", appUrl || "❌ NOT SET!");
    console.log("   Origin:", origin);
    console.log("   🔔 WEBHOOK URL:", webhookUrl);
    console.log("   🔄 Redirect URL:", `${origin}/orders/${order.id}`);
    
    if (!appUrl) {
      console.log("\n⚠️  WARNING: APP_URL not set! Monobank webhook will fail!");
      console.log("   Set APP_URL in .env to your ngrok URL");
    }
    
    // Use UAH amount (kopeks) - exchange rate was fixed at checkout
    // Ensure it's an integer (Monobank requires integer amount)
    const amountMinor = Math.round(order.totalUahMinor!);

    // Monobank has a maximum amount limit (~500,000 UAH = 50,000,000 kopeks)
    const MONOBANK_MAX_AMOUNT = 50_000_000; // 500,000 UAH
    if (amountMinor > MONOBANK_MAX_AMOUNT) {
      const maxUah = (MONOBANK_MAX_AMOUNT / 100).toLocaleString("uk-UA");
      const actualUah = (amountMinor / 100).toLocaleString("uk-UA");
      console.error(`❌ Amount ${actualUah} UAH exceeds Monobank limit of ${maxUah} UAH`);
      return NextResponse.json(
        { 
          error: `Сума замовлення (${actualUah} ₴) перевищує ліміт оплати картою (${maxUah} ₴). Для великих сум використовуйте "Покупка частинами" або зв'яжіться з нами.` 
        },
        { status: 400 }
      );
    }

    // Get exchange rate for item price conversion
    const exchangeRate = order.exchangeRateNbu!;

    // Calculate basket total to verify it matches amount
    const basketTotal = order.items.reduce((sum, item) => {
      return sum + Math.round(Math.round((item.totalMinor * exchangeRate) / 100) * 100);
    }, 0);

    console.log("\n💰 Amount details:");
    console.log("   USD minor:", order.totalMinor);
    console.log("   UAH minor (kopeks):", amountMinor);
    console.log("   Exchange rate:", exchangeRate);
    console.log("   Basket total:", basketTotal);
    console.log("   Amount matches basket:", amountMinor === basketTotal);
    console.log("   Amount type:", typeof amountMinor);

    const invoicePayload: MonoInvoiceCreateRequest = {
      amount: amountMinor, // UAH kopeks (rounded to whole hryvnias)
      ccy: getCurrencyCode("UAH"), // Always UAH for Ukrainian payments
      merchantPaymInfo: {
        reference: order.id,
        destination: `Замовлення #${order.id.slice(0, 8)}`,
        basketOrder: order.items.map((item) => ({
          name: item.name,
          qty: item.quantity,
          // Convert item total to UAH (rounded to whole hryvnias, must be integer)
          sum: Math.round(Math.round((item.totalMinor * exchangeRate) / 100) * 100),
          unit: "шт.",
          icon: item.product?.imageKey 
            ? getProductImageUrl(item.product.imageKey) 
            : undefined,
        })),
      },
      redirectUrl: `${origin}/orders/${order.id}`,
      webHookUrl: webhookUrl, // <-- USING PUBLIC URL!
      validity: 3600,
      paymentType: "debit",
    };

    console.log("\n📤 Sending to Monobank API...");
    console.log("   Payload webHookUrl:", invoicePayload.webHookUrl);
    
    // 8. Create monobank invoice
    const monoResponse = await monoCreateInvoice(invoicePayload);
    console.log("\n✅ Monobank invoice created:");
    console.log("   Invoice ID:", monoResponse.invoiceId);
    console.log("   Payment Page:", monoResponse.pageUrl);
    console.log("=".repeat(60) + "\n");

    // 9. Create Payment record (in UAH)
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: PaymentProvider.MONOBANK,
        status: PaymentStatus.CREATED,
        amountMinor: amountMinor, // UAH kopeks
        currency: "UAH",
        providerRef: monoResponse.invoiceId,
        raw: monoResponse as object,
      },
    });

    // 10. Update Order status, activePaymentId, and set expiration
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PENDING_PAYMENT,
        activePaymentId: payment.id,
        expiresAt: getOrderExpirationDate(), // 48 hours from now
      },
    });

    // 11. Return payment URL
    return NextResponse.json({
      pageUrl: monoResponse.pageUrl,
      invoiceId: monoResponse.invoiceId,
      paymentId: payment.id,
    });

  } catch (error) {
    console.error("Payment creation error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}

