import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import {
  monoGetInvoiceStatus,
  mapMonoStatusToPaymentStatus,
  shouldUpdateOrderToPaid,
  shouldUpdateOrderToCancelled,
} from "@/lib/monobank";
import { PaymentProvider, OrderStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/monobank/status?invoiceId=...
// Fallback endpoint to manually sync payment status
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { appUser } = await requireAppUser();

    // 2. Get invoiceId from query params
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId");

    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoiceId query parameter is required" },
        { status: 400 }
      );
    }

    // 3. Find Payment by invoiceId
    const payment = await prisma.payment.findFirst({
      where: {
        provider: PaymentProvider.MONOBANK,
        providerRef: invoiceId,
      },
      include: {
        order: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // 4. Verify user owns this payment's order
    if (payment.order.userId !== appUser.id) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // 5. Fetch status from monobank
    const monoStatus = await monoGetInvoiceStatus(invoiceId);

    // 6. Map and update payment status
    const newPaymentStatus = mapMonoStatusToPaymentStatus(monoStatus.status);

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newPaymentStatus,
        raw: monoStatus as object,
      },
    });

    // 7. Update order status if needed
    if (shouldUpdateOrderToPaid(newPaymentStatus)) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: OrderStatus.PAID,
        },
      });
    } else if (shouldUpdateOrderToCancelled(newPaymentStatus)) {
      if (payment.order.status === OrderStatus.PENDING_PAYMENT) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: OrderStatus.CANCELLED,
          },
        });
      }
    }

    // 8. Return status
    return NextResponse.json({
      status: newPaymentStatus,
      monoStatus: monoStatus.status,
      invoice: {
        invoiceId: monoStatus.invoiceId,
        amount: monoStatus.amount,
        ccy: monoStatus.ccy,
        createdDate: monoStatus.createdDate,
        modifiedDate: monoStatus.modifiedDate,
        failureReason: monoStatus.failureReason,
      },
      payment: {
        id: payment.id,
        orderId: payment.orderId,
        status: newPaymentStatus,
      },
    });

  } catch (error) {
    console.error("Status check error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}

