-- ========================================
-- Migration 018: Layaway Payment Plans - Add Columns
-- Date: 2026-05-01
-- Purpose: Extend layaways table to support payment plans
-- Strategy: ADDITIVE - No columns deleted or renamed
-- Type: NUMERIC(10, 2) para montos (precisión exacta)
-- ========================================

-- ========================================
-- 1. Add new columns to layaways
-- ========================================

ALTER TABLE layaways
  -- Plan configuration
  ADD COLUMN IF NOT EXISTS plan_type TEXT 
    CHECK (plan_type IN ('cash', '4_weekly_payments', '8_weekly_payments', '18_weekly_payments')),
  
  ADD COLUMN IF NOT EXISTS total_payments INTEGER,
  
  ADD COLUMN IF NOT EXISTS first_payment_amount NUMERIC(10, 2),
  
  ADD COLUMN IF NOT EXISTS minimum_first_payment_amount NUMERIC(10, 2),
  
  -- Amounts (new system) - NUMERIC(10, 2) para precisión exacta
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2),
  
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10, 2) DEFAULT 0,
  
  ADD COLUMN IF NOT EXISTS amount_remaining NUMERIC(10, 2),
  
  -- Payment tracking
  ADD COLUMN IF NOT EXISTS payments_completed INTEGER DEFAULT 0,
  
  ADD COLUMN IF NOT EXISTS payments_remaining INTEGER,
  
  ADD COLUMN IF NOT EXISTS next_payment_due_date TIMESTAMP WITH TIME ZONE,
  
  ADD COLUMN IF NOT EXISTS next_payment_amount NUMERIC(10, 2),
  
  -- Plan dates
  ADD COLUMN IF NOT EXISTS plan_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  ADD COLUMN IF NOT EXISTS plan_end_date TIMESTAMP WITH TIME ZONE,
  
  ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMP WITH TIME ZONE,
  
  -- Control
  ADD COLUMN IF NOT EXISTS consecutive_weeks_without_payment INTEGER DEFAULT 0,
  
  ADD COLUMN IF NOT EXISTS forfeited_at TIMESTAMP WITH TIME ZONE,
  
  -- Customer account link
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Policy versioning
  ADD COLUMN IF NOT EXISTS policy_version INTEGER DEFAULT 2;

-- ========================================
-- 2. Update status constraint to include new states
-- ========================================

-- Drop old constraint
ALTER TABLE layaways DROP CONSTRAINT IF EXISTS layaways_status_check;

-- Add new constraint with all states
ALTER TABLE layaways ADD CONSTRAINT layaways_status_check
  CHECK (status IN (
    -- Old states (keep for compatibility)
    'pending',
    'active',
    'completed',
    'expired',
    'cancelled',
    -- New states
    'pending_first_payment',
    'overdue',
    'forfeited',
    'cancelled_for_non_payment',
    'cancelled_manual',
    'forfeiture_pending'
  ));

-- ========================================
-- 3. Create indexes for new columns
-- ========================================

CREATE INDEX IF NOT EXISTS idx_layaways_plan_type ON layaways(plan_type);
CREATE INDEX IF NOT EXISTS idx_layaways_plan_end_date ON layaways(plan_end_date);
CREATE INDEX IF NOT EXISTS idx_layaways_last_payment_at ON layaways(last_payment_at);
CREATE INDEX IF NOT EXISTS idx_layaways_consecutive_weeks ON layaways(consecutive_weeks_without_payment);
CREATE INDEX IF NOT EXISTS idx_layaways_user_id ON layaways(user_id);
CREATE INDEX IF NOT EXISTS idx_layaways_next_payment_due ON layaways(next_payment_due_date);

-- ========================================
-- 4. Add comments for documentation
-- ========================================

COMMENT ON COLUMN layaways.plan_type IS 'Plan de pago: cash, 4_weekly_payments, 8_weekly_payments, 18_weekly_payments';
COMMENT ON COLUMN layaways.total_payments IS 'Número total de pagos del plan (1, 4, 8, o 18)';
COMMENT ON COLUMN layaways.first_payment_amount IS 'Monto del primer pago (puede ser > mínimo)';
COMMENT ON COLUMN layaways.minimum_first_payment_amount IS 'Primer pago mínimo requerido por el plan';
COMMENT ON COLUMN layaways.total_amount IS 'Precio total del producto (igual a product_price)';
COMMENT ON COLUMN layaways.amount_paid IS 'Total pagado hasta ahora (suma de todos los pagos confirmados)';
COMMENT ON COLUMN layaways.amount_remaining IS 'Saldo pendiente (total_amount - amount_paid)';
COMMENT ON COLUMN layaways.payments_completed IS 'Número de pagos completados';
COMMENT ON COLUMN layaways.payments_remaining IS 'Número de pagos pendientes';
COMMENT ON COLUMN layaways.next_payment_due_date IS 'Fecha de vencimiento del próximo pago';
COMMENT ON COLUMN layaways.next_payment_amount IS 'Monto del próximo pago';
COMMENT ON COLUMN layaways.plan_start_date IS 'Fecha de inicio del plan (cuando se confirma primer pago)';
COMMENT ON COLUMN layaways.plan_end_date IS 'Fecha límite del plan (última cuota programada)';
COMMENT ON COLUMN layaways.last_payment_at IS 'Fecha del último pago confirmado (para regla 6 semanas)';
COMMENT ON COLUMN layaways.consecutive_weeks_without_payment IS 'Contador de semanas consecutivas sin abono (para regla 6 semanas)';
COMMENT ON COLUMN layaways.forfeited_at IS 'Fecha en que se marcó como perdido (forfeited)';
COMMENT ON COLUMN layaways.user_id IS 'ID de cuenta de cliente (null si guest o creado antes de cuentas)';
COMMENT ON COLUMN layaways.policy_version IS 'Versión de política: 1=sistema antiguo (depósito+saldo), 2=planes de pago';

-- Update status comment
COMMENT ON COLUMN layaways.status IS 'Estado: pending_first_payment, active, overdue, completed, expired, forfeited, cancelled_for_non_payment, cancelled_manual, forfeiture_pending';

-- ========================================
-- 5. Backfill user_id for existing layaways (if any)
-- ========================================

UPDATE layaways
SET user_id = cp.user_id
FROM customer_profiles cp
WHERE layaways.customer_email = cp.email
  AND layaways.user_id IS NULL;

-- ========================================
-- Migration 018 complete
-- ========================================
