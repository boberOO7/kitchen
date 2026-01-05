import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import {
  createInstallmentApplication,
  calculateMonthlyPayment,
  INSTALLMENT_PERIODS,
  type InstallmentPeriod,
} from "@/lib/monobank-installments";
import { OrderStatus, PaymentMethod, InstallmentStatus } from "@prisma/client";
import { getOrderExpirationDate } from "@/server/orders/expirePendingOrders";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Get origin URL
// ─────────────────────────────────────────────────────────────────────────────

function getOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin");
  if (origin) return origin;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = request.headers.get("host");
  if (host) {
    const proto = host.includes("localhost") ? "http" : "https";
    return `${proto}://${host}`;
  }

  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  throw new Error("Could not determine origin URL");
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/mono-installments/create
// Creates a new installment application for an order
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  console.log("\n" + "=".repeat(60));
  console.log("🔵 MONO INSTALLMENTS CREATE - START");
  console.log("=".repeat(60));

  try {
    // 1. Authenticate user
    const { appUser } = await requireAppUser();
    console.log("✅ User authenticated:", appUser.id);

    // 2. Parse request body
    const body = await request.json();
    const { orderId, customerPhone, months } = body;

    console.log("📋 Request params:");
    console.log("   Order ID:", orderId);
    console.log("   Phone:", customerPhone);
    console.log("   Months:", months);

    // 3. Validate inputs
    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    if (!customerPhone) {
      return NextResponse.json(
        { error: "customerPhone is required" },
        { status: 400 }
      );
    }

    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (!cleanPhone.startsWith("380") || cleanPhone.length !== 12) {
      return NextResponse.json(
        { error: "Phone must be Ukrainian format (+380XXXXXXXXX)" },
        { status: 400 }
      );
    }

    if (!months || !INSTALLMENT_PERIODS.includes(months as InstallmentPeriod)) {
      return NextResponse.json(
        { error: `months must be one of: ${INSTALLMENT_PERIODS.join(", ")}` },
        { status: 400 }
      );
    }

    // 4. Load order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        installment: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // 5. Verify order belongs to user
    if (order.userId !== appUser.id) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // 6. Validate order status
    if (order.status !== OrderStatus.DRAFT && order.status !== OrderStatus.PENDING_PAYMENT) {
      return NextResponse.json(
        { error: `Cannot create installment for order with status: ${order.status}` },
        { status: 400 }
      );
    }

    // 7. Validate order has items and total
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

    // 8. Check for existing installment application
    if (order.installment) {
      // If there's an existing application that's not terminal, return it
      const terminalStatuses = [
        InstallmentStatus.APPROVED,
        InstallmentStatus.DECLINED,
        InstallmentStatus.CANCELED,
        InstallmentStatus.EXPIRED,
      ];
      
      if (!terminalStatuses.includes(order.installment.status)) {
        console.log("⚠️ Existing installment application found:", order.installment.id);
        return NextResponse.json({
          applicationId: order.installment.monoApplicationId,
          status: order.installment.status,
          monthlyAmount: order.installment.monthlyAmount,
          months: order.installment.months,
          message: "Existing application found",
        });
      }
      
      // Delete old terminal-status application
      await prisma.installmentApplication.delete({
        where: { id: order.installment.id },
      });
      console.log("🗑️ Deleted old installment application");
    }

    // 9. Build URLs
    const origin = getOrigin(request);
    const appUrl = process.env.APP_URL;
    const webhookUrl = appUrl
      ? `${appUrl}/api/webhooks/mono-installments`
      : `${origin}/api/webhooks/mono-installments`;
    const redirectUrl = `${origin}/orders/${order.id}`;

    console.log("\n📋 URL Configuration:");
    console.log("   Webhook URL:", webhookUrl);
    console.log("   Redirect URL:", redirectUrl);

    // 10. Create installment application record (with CREATED status)
    const installmentApp = await prisma.installmentApplication.create({
      data: {
        orderId: order.id,
        method: PaymentMethod.MONO_INSTALLMENTS,
        status: InstallmentStatus.CREATED,
        months: months,
        totalAmount: order.totalMinor,
        monthlyAmount: calculateMonthlyPayment(order.totalMinor, months),
        customerPhone: cleanPhone,
      },
    });

    console.log("✅ InstallmentApplication created:", installmentApp.id);

    // 11. Call Monobank API
    try {
      const monoResponse = await createInstallmentApplication({
        orderId: order.id,
        totalAmount: order.totalMinor,
        customerPhone: cleanPhone,
        months: months,
        products: order.items.map((item) => ({
          name: item.name,
          price: item.unitPriceMinor,
          count: item.quantity,
        })),
        redirectUrl,
        webhookUrl,
      });

      console.log("✅ Mono API response:", monoResponse);

      // 12. Update installment application with Mono's application ID
      // Note: Test platform always returns same order_id, so we need to handle duplicates
      try {
        // First, check if this monoApplicationId already exists (test platform issue)
        const existingWithSameMonoId = await prisma.installmentApplication.findFirst({
          where: { 
            monoApplicationId: monoResponse.applicationId,
            id: { not: installmentApp.id }
          },
        });
        
        if (existingWithSameMonoId) {
          console.log("⚠️ Found existing application with same Mono ID, cleaning up...");
          // Delete the old one (it's from a previous test)
          await prisma.installmentApplication.delete({
            where: { id: existingWithSameMonoId.id },
          });
        }

        await prisma.installmentApplication.update({
          where: { id: installmentApp.id },
          data: {
            monoApplicationId: monoResponse.applicationId,
            monthlyAmount: monoResponse.monthlyAmount || installmentApp.monthlyAmount,
            status: InstallmentStatus.PENDING_CUSTOMER, // Waiting for customer confirmation in app
          },
        });
      } catch (updateError) {
        console.error("⚠️ Error updating installment application:", updateError);
        // If it's a unique constraint error, try to handle it gracefully
        if ((updateError as { code?: string }).code === 'P2002') {
          // Delete conflicting record and retry
          await prisma.installmentApplication.deleteMany({
            where: { 
              monoApplicationId: monoResponse.applicationId,
              id: { not: installmentApp.id }
            },
          });
          await prisma.installmentApplication.update({
            where: { id: installmentApp.id },
            data: {
              monoApplicationId: monoResponse.applicationId,
              monthlyAmount: monoResponse.monthlyAmount || installmentApp.monthlyAmount,
              status: InstallmentStatus.PENDING_CUSTOMER,
            },
          });
        } else {
          throw updateError;
        }
      }

      // 13. Update Order
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PENDING_PAYMENT,
          paymentMethod: PaymentMethod.MONO_INSTALLMENTS,
          expiresAt: getOrderExpirationDate(),
          termsAcceptedAt: new Date(),
        },
      });

      console.log("✅ Order updated to PENDING_PAYMENT");
      console.log("=".repeat(60) + "\n");

      // 14. Return response
      return NextResponse.json({
        success: true,
        applicationId: monoResponse.applicationId,
        status: "PENDING_CUSTOMER",
        monthlyAmount: monoResponse.monthlyAmount || installmentApp.monthlyAmount,
        months: months,
        redirectUrl: monoResponse.redirectUrl,
        orderId: order.id,
      });

    } catch (monoError) {
      console.error("❌ Mono API error:", monoError);
      
      // Mark installment as failed
      await prisma.installmentApplication.update({
        where: { id: installmentApp.id },
        data: {
          status: InstallmentStatus.DECLINED,
          rawCallback: { error: String(monoError) },
        },
      });

      return NextResponse.json(
        { error: "Failed to create installment application with Monobank" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Installment creation error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create installment" },
      { status: 500 }
    );
  }
}

