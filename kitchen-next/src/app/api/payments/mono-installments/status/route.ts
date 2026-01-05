import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/mono-installments/status?orderId=xxx
// Get current installment application status for an order
// Also actively polls Mono API if status is PENDING_CUSTOMER (fallback for webhooks)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { appUser } = await requireAppUser();

    // 2. Get orderId from query params
    const orderId = request.nextUrl.searchParams.get("orderId");
    
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

    // 5. Check if there's an installment application
    if (!order.installment) {
      return NextResponse.json(
        { error: "No installment application found" },
        { status: 404 }
      );
    }

    // 6. Return status
    // Note: We rely on webhooks from Mono to update status.
    // Demo API doesn't support /api/order/status polling endpoint.
    return NextResponse.json({
      status: order.installment.status,
      applicationId: order.installment.monoApplicationId,
      months: order.installment.months,
      monthlyAmount: order.installment.monthlyAmount,
      totalAmount: order.installment.totalAmount,
      orderStatus: order.status,
    });

  } catch (error) {
    console.error("Get installment status error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}

