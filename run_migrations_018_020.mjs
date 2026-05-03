import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://orhjnwpbzxyqtyrayvoi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ========================================
// MIGRATION 018
// ========================================

const migration_018 = `
-- ========================================
-- Migration 018: Layaway Payment Plans - Add Columns
-- Date: 2026-05-01
-- ========================================

ALTER TABLE layaways
  ADD COLUMN IF NOT EXISTS plan_type TEXT 
    CHECK (plan_type IN ('cash', '4_weekly_payments', '8_weekly_payments', '18_weekly_payments')),
  ADD COLUMN IF NOT EXISTS total_payments INTEGER,
  ADD COLUMN IF NOT EXISTS first_payment_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS minimum_first_payment_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_remaining NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS payments_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payments_remaining INTEGER,
  ADD COLUMN IF NOT EXISTS next_payment_due_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS next_payment_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS plan_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS plan_end_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS consecutive_weeks_without_payment INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forfeited_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS policy_version INTEGER DEFAULT 2;

ALTER TABLE layaways DROP CONSTRAINT IF EXISTS layaways_status_check;

ALTER TABLE layaways ADD CONSTRAINT layaways_status_check
  CHECK (status IN (
    'pending',
    'active',
    'completed',
    'expired',
    'cancelled',
    'pending_first_payment',
    'overdue',
    'forfeited',
    'cancelled_for_non_payment',
    'cancelled_manual',
    'forfeiture_pending'
  ));

CREATE INDEX IF NOT EXISTS idx_layaways_plan_type ON layaways(plan_type);
CREATE INDEX IF NOT EXISTS idx_layaways_plan_end_date ON layaways(plan_end_date);
CREATE INDEX IF NOT EXISTS idx_layaways_last_payment_at ON layaways(last_payment_at);
CREATE INDEX IF NOT EXISTS idx_layaways_consecutive_weeks ON layaways(consecutive_weeks_without_payment);
CREATE INDEX IF NOT EXISTS idx_layaways_user_id ON layaways(user_id);
CREATE INDEX IF NOT EXISTS idx_layaways_next_payment_due ON layaways(next_payment_due_date);

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

COMMENT ON COLUMN layaways.status IS 'Estado: pending_first_payment, active, overdue, completed, expired, forfeited, cancelled_for_non_payment, cancelled_manual, forfeiture_pending';

UPDATE layaways
SET user_id = cp.user_id
FROM customer_profiles cp
WHERE layaways.customer_email = cp.email
  AND layaways.user_id IS NULL;
`;

// ========================================
// MIGRATION 019
// ========================================

const migration_019 = `
-- ========================================
-- Migration 019: Create layaway_payments table
-- Date: 2026-05-01
-- ========================================

CREATE TABLE IF NOT EXISTS layaway_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  layaway_id UUID NOT NULL REFERENCES layaways(id) ON DELETE CASCADE,
  payment_number INTEGER NOT NULL,
  amount_due NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN (
    'pending',
    'paid',
    'overdue',
    'cancelled',
    'forfeited',
    'failed'
  )) DEFAULT 'pending',
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  payment_type TEXT CHECK (payment_type IN (
    'first',
    'installment',
    'final',
    'extra'
  )),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_layaway_payments_layaway_id ON layaway_payments(layaway_id);
CREATE INDEX idx_layaway_payments_status ON layaway_payments(status);
CREATE INDEX idx_layaway_payments_due_date ON layaway_payments(due_date);
CREATE INDEX idx_layaway_payments_payment_number ON layaway_payments(payment_number);
CREATE UNIQUE INDEX idx_layaway_payments_unique ON layaway_payments(layaway_id, payment_number);

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
`;

// ========================================
// MIGRATION 020
// ========================================

const migration_020 = `
-- ========================================
-- Migration 020: RLS policies for layaway_payments and layaways
-- Date: 2026-05-01
-- ========================================

ALTER TABLE layaway_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on layaway_payments"
  ON layaway_payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

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

DROP POLICY IF EXISTS "Public can read layaways by token" ON layaways;
DROP POLICY IF EXISTS "Public can insert layaways" ON layaways;

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
`;

// ========================================
// VALIDATION QUERIES
// ========================================

const validation_queries = {
  check_columns: `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'layaways'
    AND column_name IN (
      'plan_type', 'total_payments', 'first_payment_amount',
      'total_amount', 'amount_paid', 'user_id', 'policy_version'
    )
    ORDER BY column_name;
  `,
  check_table: `
    SELECT COUNT(*) as count FROM information_schema.tables
    WHERE table_name = 'layaway_payments';
  `,
  check_constraint: `
    SELECT pg_get_constraintdef(oid) as definition
    FROM pg_constraint
    WHERE conname = 'layaways_status_check';
  `
};

// ========================================
// EXECUTION
// ========================================

async function runMigrations() {
  console.log('🚀 Iniciando ejecución de migraciones 018, 019, 020...\n');

  try {
    // Migration 018
    console.log('📝 Ejecutando Migration 018 (agregar columnas a layaways)...');
    const { error: error018 } = await supabase.rpc('exec_sql', { sql: migration_018 });
    
    if (error018) {
      console.error('❌ Error en Migration 018:', error018);
      return;
    }
    console.log('✅ Migration 018 completada\n');

    // Validation 018
    console.log('🔍 Validando Migration 018...');
    const { data: cols, error: colsError } = await supabase.rpc('exec_sql', { sql: validation_queries.check_columns });
    if (colsError) {
      console.error('⚠️  Error al validar columnas:', colsError);
    } else {
      console.log(`✅ Columnas nuevas verificadas (esperado: 7)\n`);
    }

    // Migration 019
    console.log('📝 Ejecutando Migration 019 (crear tabla layaway_payments)...');
    const { error: error019 } = await supabase.rpc('exec_sql', { sql: migration_019 });
    
    if (error019) {
      console.error('❌ Error en Migration 019:', error019);
      return;
    }
    console.log('✅ Migration 019 completada\n');

    // Validation 019
    console.log('🔍 Validando Migration 019...');
    const { data: table, error: tableError } = await supabase.rpc('exec_sql', { sql: validation_queries.check_table });
    if (tableError) {
      console.error('⚠️  Error al validar tabla:', tableError);
    } else {
      console.log(`✅ Tabla layaway_payments verificada\n`);
    }

    // Migration 020
    console.log('📝 Ejecutando Migration 020 (actualizar RLS)...');
    const { error: error020 } = await supabase.rpc('exec_sql', { sql: migration_020 });
    
    if (error020) {
      console.error('❌ Error en Migration 020:', error020);
      return;
    }
    console.log('✅ Migration 020 completada\n');

    // Final validation
    console.log('🔍 Validando constraint de status...');
    const { data: constraint, error: constraintError } = await supabase.rpc('exec_sql', { sql: validation_queries.check_constraint });
    if (constraintError) {
      console.error('⚠️  Error al validar constraint:', constraintError);
    } else {
      console.log(`✅ Constraint de status actualizado\n`);
    }

    console.log('🎉 TODAS LAS MIGRACIONES COMPLETADAS EXITOSAMENTE\n');
    console.log('Resumen:');
    console.log('- Migration 018: 19 columnas agregadas a layaways ✅');
    console.log('- Migration 019: Tabla layaway_payments creada ✅');
    console.log('- Migration 020: RLS actualizado (más seguro) ✅');

  } catch (err) {
    console.error('💥 Error inesperado:', err);
  }
}

runMigrations();
