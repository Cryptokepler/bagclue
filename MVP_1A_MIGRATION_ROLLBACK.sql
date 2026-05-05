-- ============================================================================
-- MVP.1A — ADMIN INVENTARIO: ROLLBACK SQL
-- ============================================================================
-- Fecha: 2026-05-05
-- Propósito: Revertir cambios de MVP_1A_MIGRATION_PRODUCTS_INVENTORY.sql
-- 
-- ADVERTENCIA: Esto eliminará TODAS las columnas agregadas y sus datos.
-- Solo ejecutar si es absolutamente necesario revertir la migración.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ELIMINAR ÍNDICES
-- ============================================================================

DROP INDEX IF EXISTS idx_products_material;
DROP INDEX IF EXISTS idx_products_authenticity;
DROP INDEX IF EXISTS idx_products_supplier;
DROP INDEX IF EXISTS idx_products_location;
DROP INDEX IF EXISTS idx_products_acquisition_date;

RAISE NOTICE 'Índices eliminados';


-- ============================================================================
-- 2. ELIMINAR COLUMNAS INTERNAS
-- ============================================================================

ALTER TABLE products DROP COLUMN IF EXISTS serial_number;
ALTER TABLE products DROP COLUMN IF EXISTS certificate_notes;
ALTER TABLE products DROP COLUMN IF EXISTS internal_notes;
ALTER TABLE products DROP COLUMN IF EXISTS physical_location;
ALTER TABLE products DROP COLUMN IF EXISTS acquisition_date;
ALTER TABLE products DROP COLUMN IF EXISTS supplier_name;
ALTER TABLE products DROP COLUMN IF EXISTS additional_costs;
ALTER TABLE products DROP COLUMN IF EXISTS cost_price;

RAISE NOTICE 'Columnas internas eliminadas';


-- ============================================================================
-- 3. ELIMINAR COLUMNAS PÚBLICAS
-- ============================================================================

ALTER TABLE products DROP COLUMN IF EXISTS included_accessories;
ALTER TABLE products DROP COLUMN IF EXISTS authenticity_verified;
ALTER TABLE products DROP COLUMN IF EXISTS condition_notes;
ALTER TABLE products DROP COLUMN IF EXISTS material;

RAISE NOTICE 'Columnas públicas eliminadas';


-- ============================================================================
-- 4. VALIDACIÓN FINAL
-- ============================================================================

DO $$
DECLARE
  remaining_columns TEXT[];
  removed_columns TEXT[] := ARRAY[
    'material',
    'condition_notes',
    'authenticity_verified',
    'included_accessories',
    'cost_price',
    'additional_costs',
    'supplier_name',
    'acquisition_date',
    'physical_location',
    'internal_notes',
    'certificate_notes',
    'serial_number'
  ];
  col TEXT;
BEGIN
  FOREACH col IN ARRAY removed_columns
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = col
    ) THEN
      remaining_columns := array_append(remaining_columns, col);
    END IF;
  END LOOP;
  
  IF array_length(remaining_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Rollback falló: columnas no eliminadas: %', remaining_columns;
  END IF;
  
  RAISE NOTICE 'Rollback MVP.1A completado: 12 columnas eliminadas correctamente';
END $$;

COMMIT;
