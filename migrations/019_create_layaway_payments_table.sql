-- ========================================
-- Migration 019: Create layaway_payments table
-- Date: 2026-05-01
-- Purpose: Track individual payments of payment plans
-- Type: NUMERIC(10, 2) para montos (precisión exacta)
-- ========================================

-- ========================================
-- 1. Create layaway_payments table
-- ========================================

CREATE TABLE IF NOT EXISTS layaway_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relation to layaway
  layaway_id UUID NOT NULL REFERENCES layaways(id) ON DELETE CASCADE,
  
  -- Payment identification
  payment_number INTEGER NOT NULL,
  
  -- Amounts - NUMERIC(10, 2) para precisión exacta
  amount_due NUMERIC(10, 2) NOT NULL,
  
  amount_paid NUMERIC(10, 2),
  
  -- Dates
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'pending',
    'paid',
    'overdue',
    'cancelled',
    'forfeited',
    'failed'
  )) DEFAULT 'pending',
  
  -- Stripe integration
  stripe_session_id TEXT,
  
  stripe_payment_intent_id TEXT,
  
  -- Payment type
  payment_type TEXT CHECK (payment_type IN (
    'first',
    'installment',
    'final',
    'extra'
  )),
  
  -- Admin notes
  admin_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. Create indexes
-- ========================================

CREATE INDEX idx_layaway_payments_layaway_id ON layaway_payments(layaway_id);
CREATE INDEX idx_layaway_payments_status ON layaway_payments(status);
CREATE INDEX idx_layaway_payments_due_date ON layaway_payments(due_date);
CREATE INDEX idx_layaway_payments_payment_number ON layaway_payments(payment_number);

-- Unique constraint: one payment_number per layaway
CREATE UNIQUE INDEX idx_layaway_payments_unique ON layaway_payments(layaway_id, payment_number);

-- ========================================
-- 3. Create trigger for updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_layaway_payments_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_layaway_payments_updated_at
  BEFORE UPDATE ON layaway_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_layaway_payments_updated_at();

-- ========================================
-- 4. Add comments
-- ========================================

COMMENT ON TABLE layaway_payments IS 'Individual payments of layaway payment plans';
COMMENT ON COLUMN layaway_payments.payment_number IS 'Payment sequence number (1, 2, 3...)';
COMMENT ON COLUMN layaway_payments.amount_due IS 'Expected payment amount (NUMERIC for precision)';
COMMENT ON COLUMN layaway_payments.amount_paid IS 'Actual payment amount (may differ slightly due to rounding)';
COMMENT ON COLUMN layaway_payments.due_date IS 'Payment due date';
COMMENT ON COLUMN layaway_payments.paid_at IS 'Actual payment confirmation timestamp';
COMMENT ON COLUMN layaway_payments.status IS 'Payment status: pending, paid, overdue, cancelled, forfeited, failed';
COMMENT ON COLUMN layaway_payments.payment_type IS 'Payment type: first, installment, final, extra';
COMMENT ON COLUMN layaway_payments.admin_notes IS 'Admin notes for manual payments, extensions, exceptions';
COMMENT ON COLUMN layaway_payments.updated_at IS 'Last modification timestamp (auto-updated via trigger)';

-- ========================================
-- Migration 019 complete
-- ========================================
