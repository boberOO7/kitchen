-- CreateEnum: PaymentMethod for user payment selection at checkout
CREATE TYPE "PaymentMethod" AS ENUM ('MONO_CARD', 'MONO_INSTALLMENTS');

-- CreateEnum: InstallmentStatus for tracking installment application state
CREATE TYPE "InstallmentStatus" AS ENUM ('CREATED', 'PENDING_CUSTOMER', 'PENDING_MERCHANT', 'APPROVED', 'DECLINED', 'CANCELED', 'EXPIRED');

-- Add PaymentProvider value for Monobank installments
ALTER TYPE "PaymentProvider" ADD VALUE 'MONOBANK_INSTALLMENTS';

-- AddColumn: paymentMethod to Order (MONO_CARD or MONO_INSTALLMENTS)
ALTER TABLE "Order" ADD COLUMN "paymentMethod" "PaymentMethod";

-- AddColumn: termsAcceptedAt to Order (when user accepted terms during checkout)
-- Note: expiresAt and expiredAt already exist in the database
ALTER TABLE "Order" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);

-- CreateTable: InstallmentApplication for "Покупка частинами" applications
CREATE TABLE "InstallmentApplication" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'MONO_INSTALLMENTS',
    "status" "InstallmentStatus" NOT NULL DEFAULT 'CREATED',
    "monoApplicationId" TEXT,
    "months" INTEGER NOT NULL,
    "monthlyAmount" INTEGER,
    "totalAmount" INTEGER NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "rawCallback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallmentApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique orderId on InstallmentApplication (one-to-one with Order)
CREATE UNIQUE INDEX "InstallmentApplication_orderId_key" ON "InstallmentApplication"("orderId");

-- CreateIndex: unique monoApplicationId on InstallmentApplication (for webhook lookups)
CREATE UNIQUE INDEX "InstallmentApplication_monoApplicationId_key" ON "InstallmentApplication"("monoApplicationId");

-- CreateIndex: status + updatedAt for efficient status queries
CREATE INDEX "InstallmentApplication_status_updatedAt_idx" ON "InstallmentApplication"("status", "updatedAt");

-- CreateIndex: orderId for efficient order lookups
CREATE INDEX "InstallmentApplication_orderId_idx" ON "InstallmentApplication"("orderId");

-- AddForeignKey: InstallmentApplication -> Order
ALTER TABLE "InstallmentApplication" ADD CONSTRAINT "InstallmentApplication_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

