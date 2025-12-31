-- Enable RLS on Order table
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders (via User table)
CREATE POLICY "Users can view own orders" ON "Order"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE "User".id = "Order"."userId" 
      AND "User"."authUserId" = auth.uid()::text
    )
  );

-- Users can insert orders for themselves
CREATE POLICY "Users can insert own orders" ON "Order"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE "User".id = "Order"."userId" 
      AND "User"."authUserId" = auth.uid()::text
    )
  );

-- Users can update their own orders
CREATE POLICY "Users can update own orders" ON "Order"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE "User".id = "Order"."userId" 
      AND "User"."authUserId" = auth.uid()::text
    )
  );

-- Users can delete their own orders
CREATE POLICY "Users can delete own orders" ON "Order"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE "User".id = "Order"."userId" 
      AND "User"."authUserId" = auth.uid()::text
    )
  );

-- Enable RLS on OrderItem table
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;

-- Users can manage order items if they own the order
CREATE POLICY "Users can view own order items" ON "OrderItem"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Order"
      JOIN "User" ON "User".id = "Order"."userId"
      WHERE "Order".id = "OrderItem"."orderId"
      AND "User"."authUserId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own order items" ON "OrderItem"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Order"
      JOIN "User" ON "User".id = "Order"."userId"
      WHERE "Order".id = "OrderItem"."orderId"
      AND "User"."authUserId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own order items" ON "OrderItem"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Order"
      JOIN "User" ON "User".id = "Order"."userId"
      WHERE "Order".id = "OrderItem"."orderId"
      AND "User"."authUserId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own order items" ON "OrderItem"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "Order"
      JOIN "User" ON "User".id = "Order"."userId"
      WHERE "Order".id = "OrderItem"."orderId"
      AND "User"."authUserId" = auth.uid()::text
    )
  );

