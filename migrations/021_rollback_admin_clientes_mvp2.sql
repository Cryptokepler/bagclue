-- ============================================================================
-- ROLLBACK Migration 021: Admin Clientes MVP.2
-- ============================================================================
-- Fecha: 2026-05-12
-- Autor: Kepler
-- Propósito: Revertir cambios de Migration 021 si es necesario
-- ============================================================================

-- IMPORTANTE: Ejecutar solo si es absolutamente necesario revertir
-- Los datos en internal_notes y archived_at se PERDERÁN permanentemente

-- ============================================================================
-- PASO 1: Drop índice
-- ============================================================================

DROP INDEX IF EXISTS idx_customer_profiles_archived_at;

-- ============================================================================
-- PASO 2: Drop columnas
-- ============================================================================
-- ADVERTENCIA: Esto eliminará permanentemente:
-- - Todas las notas internas guardadas
-- - Todos los estados de archivado

ALTER TABLE customer_profiles DROP COLUMN IF EXISTS archived_at;
ALTER TABLE customer_profiles DROP COLUMN IF EXISTS internal_notes;

-- ============================================================================
-- PASO 3: Verificar rollback
-- ============================================================================
-- Ejecutar después del rollback para confirmar:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'customer_profiles' 
--   AND column_name IN ('internal_notes', 'archived_at');
-- Resultado esperado: 0 rows (columnas eliminadas)

-- ============================================================================
-- Rollback complete
-- ============================================================================
