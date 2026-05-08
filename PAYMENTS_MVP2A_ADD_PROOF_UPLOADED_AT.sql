-- ============================================================================
-- PAYMENTS MVP.2A — Micro-Migration: Add proof_uploaded_at
-- ============================================================================
-- Fecha: 2026-05-08
-- Autor: Kepler
-- Objetivo: Agregar columna proof_uploaded_at a payment_transactions
-- Motivo: Auditoría clara de cuándo se subió el comprobante
-- Compatibilidad: 100% backward-compatible
-- Rollback: Ver PAYMENTS_MVP2A_ROLLBACK_PROOF_UPLOADED_AT.sql
-- Validación: Ver validation query al final
-- ============================================================================

-- Agregar columna proof_uploaded_at (nullable, timestamp con timezone)
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS proof_uploaded_at TIMESTAMPTZ;

-- Agregar comentario (documentación en DB)
COMMENT ON COLUMN payment_transactions.proof_uploaded_at IS 'Timestamp when customer uploaded bank transfer proof';

-- Notificar a PostgREST que recargue el schema
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VALIDATION QUERY
-- ============================================================================
-- Ejecutar manualmente después de aplicar la migración:
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'payment_transactions'
--   AND column_name = 'proof_uploaded_at';
--
-- Resultado esperado:
-- - 1 row
-- - data_type: timestamp with time zone
-- - is_nullable: YES
-- ============================================================================
