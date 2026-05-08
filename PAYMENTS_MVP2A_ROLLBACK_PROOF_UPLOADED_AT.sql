-- ============================================================================
-- PAYMENTS MVP.2A — Rollback: Remove proof_uploaded_at
-- ============================================================================
-- Fecha: 2026-05-08
-- Autor: Kepler
-- Objetivo: Rollback de PAYMENTS_MVP2A_ADD_PROOF_UPLOADED_AT.sql
-- ⚠️ CUIDADO: Esto eliminará la columna y sus datos
-- ============================================================================

-- Eliminar columna proof_uploaded_at
ALTER TABLE payment_transactions
DROP COLUMN IF EXISTS proof_uploaded_at;

-- Notificar a PostgREST que recargue el schema
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VALIDATION QUERY (después del rollback)
-- ============================================================================
-- Ejecutar manualmente para confirmar que la columna NO existe:
--
-- SELECT column_name
-- FROM information_schema.columns
-- WHERE table_name = 'payment_transactions'
--   AND column_name = 'proof_uploaded_at';
--
-- Resultado esperado:
-- - 0 rows (columna eliminada)
-- ============================================================================
