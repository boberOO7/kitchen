/*
  Warnings:

  - You are about to drop the column `subtotalCents` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `totalCents` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `totalCents` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `unitPriceCents` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `amountCents` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `priceCents` on the `Product` table. All the data in the column will be lost.
  - Added the required column `total` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "subtotalCents",
DROP COLUMN "totalCents",
ADD COLUMN     "subtotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "currency" SET DEFAULT 'USD';

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "totalCents",
DROP COLUMN "unitPriceCents",
ADD COLUMN     "total" INTEGER NOT NULL,
ADD COLUMN     "unitPrice" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "amountCents",
ADD COLUMN     "amount" INTEGER NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'USD';

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "priceCents",
ADD COLUMN     "price" INTEGER NOT NULL;
