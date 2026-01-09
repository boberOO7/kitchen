import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { merchantConfirmInstallment } from "@/lib/monobank-installments";
import { OrderStatus, InstallmentStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/mono-installments/merchant-confirm
// Confirms installment application from merchant side (2-step flow)
// Used when phone ends with 4 in test scenarios
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  console.log("\n" + "=".repeat(60));
  console.log("🔵 MONO INSTALLMENTS MERCHANT CONFIRM - START");
  console.log("=".repeat(60));

  try {
    // 1. Authenticate user
    const { appUser } = await requireAppUser();
    console.log("✅ User authenticated:", appUser.id);

    // 2. Parse request body
    const body = await request.json();
    const { orderId } = body;

    console.log("📋 Request params:");
    console.log("   Order ID:", orderId);

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    // 3. Load order with installment application
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        installment: true,
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

    // 5. Validate installment application exists
    if (!order.installment) {
      return NextResponse.json(
        { error: "No installment application found for this order" },
        { status: 400 }
      );
    }

    // 6. Validate status is PENDING_MERCHANT
    if (order.installment.status !== InstallmentStatus.PENDING_MERCHANT) {
      return NextResponse.json(
        { error: `Cannot confirm installment with status: ${order.installment.status}` },
        { status: 400 }
      );
    }

    // 7. Validate monoApplicationId exists
    if (!order.installment.monoApplicationId) {
      return NextResponse.json(
        { error: "Installment application ID not found" },
        { status: 400 }
      );
    }

    console.log("📤 Calling Mono merchant confirm...");
    console.log("   Application ID:", order.installment.monoApplicationId);

    // 8. Call Monobank merchant confirm API
    try {
      const result = await merchantConfirmInstallment(order.installment.monoApplicationId);

      console.log("✅ Merchant confirm result:", result);

      // 9. Update installment status to APPROVED
      await prisma.installmentApplication.update({
        where: { id: order.installment.id },
        data: {
          status: InstallmentStatus.APPROVED,
          rawCallback: { merchantConfirm: result },
        },
      });

      // 10. Update order status to PAID
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
        },
      });

      console.log("🎉 Order marked as PAID!");
      console.log("=".repeat(60) + "\n");

      return NextResponse.json({
        success: true,
        status: "APPROVED",
        orderId: order.id,
      });

    } catch (monoError) {
      console.error("❌ Mono merchant confirm error:", monoError);

      return NextResponse.json(
        { error: "Failed to confirm installment with Monobank" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Merchant confirm error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to confirm installment" },
      { status: 500 }
    );
  }
}

