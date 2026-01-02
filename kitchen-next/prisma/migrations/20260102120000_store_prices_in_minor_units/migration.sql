-- Rename price fields to indicate they store values in minor units (cents/kopeks)

-- Product: price → priceMinor
ALTER TABLE "Product" RENAME COLUMN "price" TO "priceMinor";

-- OrderItem: unitPrice → unitPriceMinor, total → totalMinor
ALTER TABLE "OrderItem" RENAME COLUMN "unitPrice" TO "unitPriceMinor";
ALTER TABLE "OrderItem" RENAME COLUMN "total" TO "totalMinor";

-- Order: subtotal → subtotalMinor, total → totalMinor
ALTER TABLE "Order" RENAME COLUMN "subtotal" TO "subtotalMinor";
ALTER TABLE "Order" RENAME COLUMN "total" TO "totalMinor";

-- Payment: amount → amountMinor
ALTER TABLE "Payment" RENAME COLUMN "amount" TO "amountMinor";

