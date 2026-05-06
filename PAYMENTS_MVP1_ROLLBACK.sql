-- ============================================================================
-- PAYMENTS MVP.1 — DB SCHEMA ROLLBACK (V3 - FINAL)
-- ============================================================================
-- Fecha: 2026-05-06
-- Versión: V3 (ajustes de seguridad)
-- Autor: Kepler
-- Objetivo: Revertir cambios de PAYMENTS_MVP1_MIGRATION.sql V3
-- Uso: Ejecutar SOLO si la migración causó problemas en producción
-- Advertencia: Elimina tabla payment_transactions y columnas agregadas
-- Ventana de rollback: 24-48 horas después de deploy
-- ============================================================================

-- ============================================================================
-- VERIFICACIÓN PREVIA (Opcional pero recomendado)
-- ============================================================================
-- Antes de ejecutar rollback, verificar:
-- 1. ¿Cuántas transacciones existen? (si >0, considerar backup)
-- 2. ¿Checkout Stripe está fallando? (motivo del rollback)
-- 3. ¿Hay tiempo para investigar o necesitamos rollback inmediato?

-- SELECT COUNT(*) FROM payment_transactions;
-- Si hay transacciones importantes, exportar antes de rollback:
-- COPY payment_transactions TO '/tmp/payment_transactions_backup.csv' CSV HEADER;

-- ============================================================================
-- PASO 1: ELIMINAR POLÍTICAS RLS DE payment_transactions
-- ============================================================================
-- V3: Solo 3 políticas (no 4)

DROP POLICY IF EXISTS "Admins can confirm/reject transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON payment_transactions;

-- V3: Esta política no existe (fue removida en V3)
-- DROP POLICY IF EXISTS "Users can upload proof for own transactions" ON payment_transactions;

-- ============================================================================
-- PASO 2: ELIMINAR BUCKET bank-payment-proofs
-- ============================================================================
-- V3: Bucket no tiene políticas RLS, solo eliminar bucket

DELETE FROM storage.buckets WHERE id = 'bank-payment-proofs';

-- V3: NO hay políticas de storage que eliminar (no fueron creadas)

-- ============================================================================
-- PASO 3: ELIMINAR TRIGGER updated_at DE payment_transactions
-- ============================================================================

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;

-- ============================================================================
-- PASO 4: ELIMINAR ÍNDICES DE payment_transactions
-- ============================================================================

DROP INDEX IF EXISTS idx_payment_transactions_expires_at;
DROP INDEX IF EXISTS idx_payment_transactions_created_at;
DROP INDEX IF EXISTS idx_payment_transactions_payment_method;
DROP INDEX IF EXISTS idx_payment_transactions_status;
DROP INDEX IF EXISTS idx_payment_transactions_layaway_payment_id;
DROP INDEX IF EXISTS idx_payment_transactions_layaway_id;
DROP INDEX IF EXISTS idx_payment_transactions_order_id;

-- ============================================================================
-- PASO 5: ELIMINAR TABLA payment_transactions
-- ============================================================================

DROP TABLE IF EXISTS payment_transactions CASCADE;

-- ============================================================================
-- PASO 6: ELIMINAR COLUMNAS DE layaway_payments
-- ============================================================================

ALTER TABLE layaway_payments
  DROP COLUMN IF EXISTS payment_reference,
  DROP COLUMN IF EXISTS payment_method;

-- ============================================================================
-- PASO 7: ELIMINAR COLUMNAS DE layaways
-- ============================================================================

ALTER TABLE layaways
  DROP COLUMN IF EXISTS exchange_rate,
  DROP COLUMN IF EXISTS payment_currency,
  DROP COLUMN IF EXISTS payment_method;

-- ============================================================================
-- PASO 8: ELIMINAR COLUMNAS DE orders
-- ============================================================================

ALTER TABLE orders
  DROP COLUMN IF EXISTS payment_expires_at,
  DROP COLUMN IF EXISTS amount_usd,
  DROP COLUMN IF EXISTS amount_mxn,
  DROP COLUMN IF EXISTS exchange_rate,
  DROP COLUMN IF EXISTS payment_reference,
  DROP COLUMN IF EXISTS payment_currency,
  DROP COLUMN IF EXISTS payment_method;

-- ============================================================================
-- PASO 9: ELIMINAR FUNCIÓN update_updated_at_column (Opcional)
-- ============================================================================
-- V3: La función fue creada/reemplazada en migration
-- ADVERTENCIA: Solo eliminar si NO es usada por otras tablas

-- Verificar si otras tablas usan esta función:
-- SELECT DISTINCT trigger_name, event_object_table
-- FROM information_schema.triggers
-- WHERE action_statement LIKE '%update_updated_at_column%';

-- Si NO hay otras tablas usando la función, descomentar para eliminar:
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Si HAY otras tablas usando la función, NO eliminar (dejar comentado arriba)

-- ============================================================================
-- FIN DE ROLLBACK V3
-- ============================================================================
-- Base de datos ha sido revertida al estado pre-migración.
-- 
-- Próximos pasos después de rollback:
-- 1. Restart app (Vercel) — NO debería ser necesario
-- 2. QA manual: 1 compra Stripe test → verificar checkout funciona
-- 3. Revisar logs para identificar causa raíz del problema
-- 4. Investigar y preparar fix antes de reintentar migración
-- 5. Si checkout Stripe sigue fallando después de rollback:
--    → Problema NO es la migración (investigar otra causa)
-- 
-- Criterio para considerar rollback exitoso:
-- ✅ Checkout Stripe funciona normal
-- ✅ No hay errores en logs relacionados con columnas payment_*
-- ✅ Performance de queries de orders normal (<200ms)
-- ✅ Datos de orders/layaways/layaway_payments existentes intactos
-- 
-- Cambios V3 en rollback:
-- - Solo 3 políticas RLS eliminadas (no 4)
-- - No eliminar políticas de storage (no fueron creadas)
-- - Función update_updated_at_column NO se elimina automáticamente (puede usarse en otras tablas)
-- ============================================================================
