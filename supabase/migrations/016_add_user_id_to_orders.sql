-- Migration 016: Add user_id to orders
-- Date: 2026-05-01
-- Purpose: Link orders to customer accounts for /account/orders panel

-- 1. Add user_id column (nullable to support guest checkout)
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- 3. Backfill existing orders: link by email using customer_profiles
UPDATE orders
SET user_id = cp.user_id
FROM customer_profiles cp
WHERE orders.customer_email = cp.email
  AND orders.user_id IS NULL;

COMMENT ON COLUMN orders.user_id IS 'Linked customer account (null for guest checkout)';
