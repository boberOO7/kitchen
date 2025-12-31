-- CreateIndex: Ensure only one DRAFT order per user (cart)
-- Using partial unique index since Prisma doesn't support this natively

CREATE UNIQUE INDEX "unique_draft_order_per_user" ON "Order" ("userId") WHERE status = 'DRAFT';

