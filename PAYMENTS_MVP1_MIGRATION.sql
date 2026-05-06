-- ============================================================================
-- PAYMENTS MVP.1 — DB SCHEMA MIGRATION (V3 - FINAL)
-- ============================================================================
-- Fecha: 2026-05-06
-- Versión: V3 (ajustes de seguridad)
-- Autor: Kepler
-- Objetivo: Preparar DB para pagos por transferencia MXN y futuros pagos USD
-- Compatibilidad: 100% backward-compatible (no rompe funcionalidad existente)
-- Rollback: Ver PAYMENTS_MVP1_ROLLBACK.sql
-- Validación: Ver PAYMENTS_MVP1_VALIDATION.sql
-- Cambios V2→V3: Ver PAYMENTS_MVP1_V2_TO_V3_CHANGES.md
-- ============================================================================

-- ============================================================================
-- PASO 0: CREAR FUNCIÓN update_updated_at_column (si no existe)
-- ============================================================================
-- V3: No asumir que existe, crearla siempre (CREATE OR REPLACE es idempotente)

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PASO 1: CREAR TABLA payment_transactions (Centro del Sistema)
-- ============================================================================

CREATE TABLE payment_transactions (
  -- Identificación
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones (al menos 1 requerida)
  -- V3: ON DELETE RESTRICT (no SET NULL) para evitar violar CHECK constraint
  order_id UUID REFERENCES orders(id) ON DELETE RESTRICT,
  layaway_id UUID REFERENCES layaways(id) ON DELETE RESTRICT,
  layaway_payment_id UUID REFERENCES layaway_payments(id) ON DELETE RESTRICT,
  
  -- Tipo de pago
  payment_type TEXT NOT NULL CHECK (payment_type IN (
    'full_purchase',       -- Compra completa
    'layaway_deposit',     -- Depósito inicial apartado
    'layaway_installment'  -- Abono/pago final apartado
  )),
  
  -- Método de pago
  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'bank_transfer_mxn',   -- Transferencia bancaria MXN
    'stripe_usd'           -- Stripe Checkout USD
  )),
  
  -- Moneda y montos
  currency TEXT NOT NULL CHECK (currency IN ('MXN', 'USD')),
  amount NUMERIC(12,2) NOT NULL,           -- Monto en moneda original
  amount_mxn NUMERIC(12,2),                -- Monto convertido a MXN (si aplica)
  amount_usd NUMERIC(12,2),                -- Monto convertido a USD (si aplica)
  exchange_rate NUMERIC(12,6),             -- Tipo de cambio aplicado (si aplica)
  
  -- Estado del pago
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',           -- Esperando acción del usuario
    'proof_uploaded',    -- Comprobante subido (pendiente revisión admin)
    'confirmed',         -- Pago confirmado por admin
    'rejected',          -- Pago rechazado por admin
    'failed',            -- Pago falló (Stripe)
    'expired'            -- Pago expiró (24h sin comprobante)
  )),
  
  -- Referencia de pago
  payment_reference TEXT UNIQUE,           -- Referencia única (bank o Stripe session)
  
  -- Comprobante (solo bank_transfer_mxn)
  proof_url TEXT,                          -- URL del comprobante en storage
  proof_file_name TEXT,                    -- Nombre original del archivo
  proof_file_type TEXT,                    -- Tipo MIME (image/jpeg, image/png, application/pdf)
  proof_file_size INTEGER,                 -- Tamaño en bytes
  proof_hash TEXT,                         -- Hash SHA256 del archivo (anti-duplicados)
  
  -- Stripe (solo stripe_usd)
  stripe_session_id TEXT,                  -- Checkout session ID
  stripe_payment_intent_id TEXT,           -- Payment intent ID
  
  -- Admin
  admin_notes TEXT,                        -- Notas internas del admin
  rejection_reason TEXT,                   -- Motivo de rechazo (si aplica)
  
  -- Timestamps de confirmación/rechazo
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- V3: SET NULL OK aquí
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,   -- V3: SET NULL OK aquí
  
  -- Expiración
  expires_at TIMESTAMPTZ,                  -- 24h desde creación (si bank_transfer_mxn)
  
  -- Auditoría
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: al menos 1 relación requerida
  CONSTRAINT payment_transaction_has_relation CHECK (
    order_id IS NOT NULL OR 
    layaway_id IS NOT NULL OR 
    layaway_payment_id IS NOT NULL
  )
);

-- ============================================================================
-- PASO 2: CREAR ÍNDICES EN payment_transactions
-- ============================================================================

CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_layaway_id ON payment_transactions(layaway_id);
CREATE INDEX idx_payment_transactions_layaway_payment_id ON payment_transactions(layaway_payment_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_payment_method ON payment_transactions(payment_method);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX idx_payment_transactions_expires_at ON payment_transactions(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- PASO 3: CREAR TRIGGER updated_at EN payment_transactions
-- ============================================================================

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PASO 4: AGREGAR COLUMNAS NUEVAS A orders
-- ============================================================================

ALTER TABLE orders
  ADD COLUMN payment_method TEXT CHECK (payment_method IN ('bank_transfer_mxn', 'stripe_usd')),
  ADD COLUMN payment_currency TEXT CHECK (payment_currency IN ('MXN', 'USD')),
  ADD COLUMN payment_reference TEXT,
  ADD COLUMN exchange_rate NUMERIC(12,6),
  ADD COLUMN amount_mxn NUMERIC(12,2),
  ADD COLUMN amount_usd NUMERIC(12,2),
  ADD COLUMN payment_expires_at TIMESTAMPTZ;

-- ============================================================================
-- PASO 5: AGREGAR COLUMNAS NUEVAS A layaways
-- ============================================================================

ALTER TABLE layaways
  ADD COLUMN payment_method TEXT CHECK (payment_method IN ('bank_transfer_mxn', 'stripe_usd')),
  ADD COLUMN payment_currency TEXT CHECK (payment_currency IN ('MXN', 'USD')),
  ADD COLUMN exchange_rate NUMERIC(12,6);

-- ============================================================================
-- PASO 6: AGREGAR COLUMNAS NUEVAS A layaway_payments
-- ============================================================================

ALTER TABLE layaway_payments
  ADD COLUMN payment_method TEXT CHECK (payment_method IN ('bank_transfer_mxn', 'stripe_usd')),
  ADD COLUMN payment_reference TEXT;

-- ============================================================================
-- PASO 7: HABILITAR RLS EN payment_transactions
-- ============================================================================

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 8: CREAR POLÍTICAS RLS PARA payment_transactions
-- ============================================================================
-- V3: Solo 3 políticas (removida "Users can upload proof")

-- Política 1: Usuarios autenticados pueden ver SUS transacciones
CREATE POLICY "Users can view own transactions"
  ON payment_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payment_transactions.order_id
        AND orders.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM layaways
      WHERE layaways.id = payment_transactions.layaway_id
        AND layaways.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM layaway_payments lp
      JOIN layaways l ON l.id = lp.layaway_id
      WHERE lp.id = payment_transactions.layaway_payment_id
        AND l.user_id = auth.uid()
    )
  );

-- Política 2: Admins pueden ver TODAS las transacciones
CREATE POLICY "Admins can view all transactions"
  ON payment_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
        AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Política 3: Admins pueden confirmar/rechazar transacciones
CREATE POLICY "Admins can confirm/reject transactions"
  ON payment_transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
        AND raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    status IN ('proof_uploaded', 'confirmed', 'rejected')
  );

-- V3: NO crear política UPDATE para usuarios
-- Upload de comprobante será via API con service role en MVP.2

-- ============================================================================
-- PASO 9: CREAR STORAGE BUCKET bank-payment-proofs
-- ============================================================================
-- V3: Bucket privado SIN políticas RLS públicas (más seguro)

-- Insertar bucket (puede fallar si ya existe, es OK)
INSERT INTO storage.buckets (id, name, public)
VALUES ('bank-payment-proofs', 'bank-payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- V3: NO crear políticas de storage todavía
-- Políticas se implementan en MVP.2 cuando exista upload API
-- Por ahora, bucket privado solo accesible por service role

-- ============================================================================
-- FIN DE MIGRACIÓN V3
-- ============================================================================
-- Próximos pasos:
-- 1. Ejecutar PAYMENTS_MVP1_VALIDATION.sql para verificar
-- 2. QA manual: 1 compra Stripe test → verificar checkout funciona
-- 3. Monitoring logs durante 2 horas
-- 4. Si algo falla: ejecutar PAYMENTS_MVP1_ROLLBACK.sql
-- 
-- Cambios principales V3:
-- - FK con ON DELETE RESTRICT (no SET NULL) para order_id/layaway_id/layaway_payment_id
-- - Solo 3 políticas RLS en payment_transactions (no 4)
-- - Bucket storage privado sin políticas públicas
-- - Función update_updated_at_column creada explícitamente
-- ============================================================================
