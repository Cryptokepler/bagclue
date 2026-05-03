-- ============================================================================
-- MIGRATION 024: CUSTOMER ADDRESSES
-- Created: 2026-05-03
-- Phase: 5D.1
-- Author: Kepler
-- Status: APPROVED - Ready to execute
-- ============================================================================

-- 1. CREATE TABLE
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  full_name TEXT NOT NULL,
  phone_country_code TEXT DEFAULT '+52',
  phone_country_iso TEXT DEFAULT 'MX',
  phone TEXT,
  
  country TEXT NOT NULL DEFAULT 'México',
  state TEXT,
  city TEXT NOT NULL,
  postal_code TEXT,
  
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  delivery_references TEXT,
  
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id 
ON customer_addresses(user_id);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_is_default 
ON customer_addresses(is_default) 
WHERE is_default = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_addresses_user_default 
ON customer_addresses(user_id) 
WHERE is_default = true;

-- 3. FUNCTION (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TRIGGER (SAFEGUARD: Drop if exists first)
DROP TRIGGER IF EXISTS set_customer_addresses_updated_at ON customer_addresses;

CREATE TRIGGER set_customer_addresses_updated_at
BEFORE UPDATE ON customer_addresses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5. ENABLE RLS
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES (SAFEGUARD: Drop existing policies first)
DROP POLICY IF EXISTS "Customers can delete own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Customers can update own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Customers can insert own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Customers can view own addresses" ON customer_addresses;

CREATE POLICY "Customers can view own addresses"
ON customer_addresses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Customers can insert own addresses"
ON customer_addresses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can update own addresses"
ON customer_addresses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can delete own addresses"
ON customer_addresses
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- END OF MIGRATION 024
