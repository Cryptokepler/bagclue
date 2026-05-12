-- ============================================================================
-- VALIDATION Migration 021: Admin Clientes MVP.2
-- ============================================================================
-- Fecha: 2026-05-12
-- Autor: Kepler
-- Propósito: Validar que Migration 021 se ejecutó correctamente
-- ============================================================================

-- ============================================================================
-- TEST 1: Verificar que columnas existen
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'customer_profiles'
  AND column_name IN ('internal_notes', 'archived_at')
ORDER BY column_name;

-- Resultado esperado:
-- column_name      | data_type                   | is_nullable | column_default
-- -----------------+-----------------------------+-------------+---------------
-- archived_at      | timestamp with time zone    | YES         | NULL
-- internal_notes   | text                        | YES         | NULL

-- ============================================================================
-- TEST 2: Verificar que índice existe
-- ============================================================================

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'customer_profiles'
  AND indexname = 'idx_customer_profiles_archived_at';

-- Resultado esperado:
-- indexname                           | indexdef
-- ------------------------------------+--------------------------------------------------------------
-- idx_customer_profiles_archived_at   | CREATE INDEX idx_customer_profiles_archived_at ON ...

-- ============================================================================
-- TEST 3: Verificar que columnas son opcionales (NULL permitido)
-- ============================================================================

SELECT 
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'customer_profiles'
  AND column_name IN ('internal_notes', 'archived_at')
  AND is_nullable = 'YES';

-- Resultado esperado: 2 rows (ambas columnas permiten NULL)

-- ============================================================================
-- TEST 4: Verificar comentarios de columnas
-- ============================================================================

SELECT 
  col_description(
    (SELECT oid FROM pg_class WHERE relname = 'customer_profiles'),
    (SELECT ordinal_position FROM information_schema.columns 
     WHERE table_name = 'customer_profiles' AND column_name = 'internal_notes')
  ) AS internal_notes_comment,
  col_description(
    (SELECT oid FROM pg_class WHERE relname = 'customer_profiles'),
    (SELECT ordinal_position FROM information_schema.columns 
     WHERE table_name = 'customer_profiles' AND column_name = 'archived_at')
  ) AS archived_at_comment;

-- Resultado esperado: Comentarios descriptivos en ambas columnas

-- ============================================================================
-- TEST 5: Verificar que customer_profiles existentes NO fueron afectados
-- ============================================================================

SELECT 
  COUNT(*) AS total_profiles,
  COUNT(internal_notes) AS profiles_with_notes,
  COUNT(archived_at) AS profiles_archived
FROM customer_profiles;

-- Resultado esperado:
-- - total_profiles > 0 (perfiles existentes)
-- - profiles_with_notes = 0 (nuevas columnas en NULL)
-- - profiles_archived = 0 (nuevas columnas en NULL)

-- ============================================================================
-- TEST 6: Probar query de clientes activos (filtro archivados)
-- ============================================================================

SELECT 
  id,
  email,
  name,
  archived_at
FROM customer_profiles
WHERE archived_at IS NULL
LIMIT 5;

-- Resultado esperado: Clientes activos (archived_at = NULL)

-- ============================================================================
-- TEST 7: Verificar performance del índice
-- ============================================================================

EXPLAIN ANALYZE
SELECT id, email, name
FROM customer_profiles
WHERE archived_at IS NULL
LIMIT 100;

-- Resultado esperado: Index Scan usando idx_customer_profiles_archived_at

-- ============================================================================
-- Validation complete
-- ============================================================================
-- Si todos los tests pasan, Migration 021 fue exitosa ✅
