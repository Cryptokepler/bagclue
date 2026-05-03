-- Migration 017: RLS policies for customer orders (SECURE VERSION)
-- Date: 2026-05-01
-- Purpose: Allow customers to view only their own orders
-- Security: NO public policies - all access via authenticated users or service role

-- ========================================
-- 1. Enable RLS on orders
-- ========================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. Orders Policies
-- ========================================

-- Policy 1: Service role full access (for admin, tracking API, checkout API)
CREATE POLICY "Service role full access on orders"
  ON orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Authenticated customers can view their own orders
-- Matches by user_id OR by email (fallback for guest orders linked later)
CREATE POLICY "Customers can view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    customer_email IN (
      SELECT email FROM customer_profiles WHERE user_id = auth.uid()
    )
  );

-- ========================================
-- 3. Enable RLS on order_items
-- ========================================

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. Order Items Policies
-- ========================================

-- Policy 1: Service role full access (for admin, tracking API, checkout API)
CREATE POLICY "Service role full access on order_items"
  ON order_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Authenticated customers can view items of their own orders
CREATE POLICY "Customers can view own order_items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE user_id = auth.uid()
         OR customer_email IN (
           SELECT email FROM customer_profiles WHERE user_id = auth.uid()
         )
    )
  );

-- ========================================
-- SECURITY NOTES:
-- ========================================
-- 1. NO public (anon) policies on orders or order_items
-- 2. Tracking uses service role via /api/orders/track/[token] → bypasses RLS
-- 3. Checkout uses service role via /api/checkout/create-session → bypasses RLS
-- 4. Admin uses service role via supabaseAdmin → bypasses RLS
-- 5. Customer panel uses authenticated + RLS → sees only own orders
-- 6. Guest checkout continues working via service role
-- 7. No risk of exposing other customers' orders via public policies
