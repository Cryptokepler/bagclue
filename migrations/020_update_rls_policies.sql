-- ========================================
-- Migration 020: RLS policies for layaway_payments and layaways
-- Date: 2026-05-01
-- Purpose: Secure RLS while maintaining tracking and checkout functionality
-- ========================================

-- ========================================
-- PARTE 1: RLS para layaway_payments (nueva tabla)
-- ========================================

-- 1.1. Enable RLS
ALTER TABLE layaway_payments ENABLE ROW LEVEL SECURITY;

-- 1.2. Service role full access (admin, tracking API, checkout API)
CREATE POLICY "Service role full access on layaway_payments"
  ON layaway_payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 1.3. Authenticated customers can view payments of their own layaways
CREATE POLICY "Customers can view own layaway payments"
  ON layaway_payments
  FOR SELECT
  TO authenticated
  USING (
    layaway_id IN (
      SELECT id FROM layaways
      WHERE user_id = auth.uid()
         OR customer_email IN (
           SELECT email FROM customer_profiles WHERE user_id = auth.uid()
         )
    )
  );

-- ========================================
-- PARTE 2: Actualizar RLS de layaways (más segura)
-- ========================================

-- 2.1. Drop old public policies (demasiado permisivas)
DROP POLICY IF EXISTS "Public can read layaways by token" ON layaways;
DROP POLICY IF EXISTS "Public can insert layaways" ON layaways;

-- 2.2. Add policy for authenticated customers to view their own layaways
CREATE POLICY "Customers can view own layaways"
  ON layaways
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
-- SECURITY NOTES:
-- ========================================
-- 1. Service role bypasses RLS (for admin, tracking API, checkout API)
-- 2. Authenticated customers can only see their own layaways and payments
-- 3. NO public (anon) access to layaways or layaway_payments directly
--
-- 4. TRACKING PÚBLICO sigue funcionando:
--    - /layaway/[token] usa service role en API route
--    - API route valida token antes de retornar datos
--    - RLS no aplica porque se usa supabaseAdmin (service role)
--
-- 5. CHECKOUT sigue funcionando:
--    - /api/checkout/create-layaway usa service role
--    - API route valida request y crea layaway
--    - RLS no aplica porque se usa supabaseAdmin
--
-- 6. ADMIN sigue funcionando:
--    - Admin panel usa supabaseAdmin (service role)
--    - Admin ve todos los layaways
--    - RLS no aplica
--
-- 7. PANEL CLIENTE funciona:
--    - Cliente autenticado usa RLS policies
--    - Solo ve sus propios layaways/payments
--    - RLS aplica (SELECT policy)
-- ========================================

-- ========================================
-- Migration 020 complete
-- ========================================
