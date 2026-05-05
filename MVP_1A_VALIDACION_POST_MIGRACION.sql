-- ============================================================================
-- MVP.1A — ADMIN INVENTARIO: VALIDACIONES POST-MIGRACIÓN
-- ============================================================================
-- Fecha: 2026-05-05
-- Propósito: Verificar integridad después de ejecutar MVP_1A_MIGRATION_PRODUCTS_INVENTORY.sql
-- 
-- Ejecutar estas queries DESPUÉS de la migración para confirmar que todo está correcto.
-- ============================================================================


-- ============================================================================
-- 1. VERIFICAR EXISTENCIA DE COLUMNAS
-- ============================================================================

-- Query que debe retornar 12 filas (una por cada columna nueva)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN (
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
  )
ORDER BY column_name;

-- ✅ PASS: Debe retornar exactamente 12 filas
-- ❌ FAIL: Si retorna menos de 12 filas, alguna columna no se creó


-- ============================================================================
-- 2. VERIFICAR TIPOS DE DATOS CORRECTOS
-- ============================================================================

SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN (
    'material', 'condition_notes', 'included_accessories',
    'supplier_name', 'physical_location', 'internal_notes',
    'certificate_notes', 'serial_number'
  )
  AND data_type != 'text';

-- ✅ PASS: Debe retornar 0 filas (todos TEXT)
-- ❌ FAIL: Si retorna filas, hay columnas con tipo incorrecto


SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name = 'authenticity_verified'
  AND data_type != 'boolean';

-- ✅ PASS: Debe retornar 0 filas (authenticity_verified es boolean)
-- ❌ FAIL: Si retorna 1 fila, tipo incorrecto


SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name = 'cost_price'
  AND data_type != 'numeric';

-- ✅ PASS: Debe retornar 0 filas (cost_price es numeric)
-- ❌ FAIL: Si retorna 1 fila, tipo incorrecto


SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name = 'additional_costs'
  AND data_type != 'jsonb';

-- ✅ PASS: Debe retornar 0 filas (additional_costs es jsonb)
-- ❌ FAIL: Si retorna 1 fila, tipo incorrecto


SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name = 'acquisition_date'
  AND data_type != 'date';

-- ✅ PASS: Debe retornar 0 filas (acquisition_date es date)
-- ❌ FAIL: Si retorna 1 fila, tipo incorrecto


-- ============================================================================
-- 3. VERIFICAR QUE TODAS LAS COLUMNAS SON NULLABLE O TIENEN DEFAULT
-- ============================================================================

SELECT 
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN (
    'material', 'condition_notes', 'included_accessories',
    'cost_price', 'supplier_name', 'acquisition_date',
    'physical_location', 'internal_notes', 'certificate_notes',
    'serial_number'
  )
  AND is_nullable = 'NO'
  AND column_default IS NULL;

-- ✅ PASS: Debe retornar 0 filas (todas nullable o con default)
-- ❌ FAIL: Si retorna filas, hay columnas NOT NULL sin default (bloqueará inserts)


SELECT 
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('authenticity_verified', 'additional_costs');

-- ✅ PASS: Debe retornar 2 filas con defaults (FALSE y '{}')
-- ❌ FAIL: Si no tienen defaults, revisar migración


-- ============================================================================
-- 4. VERIFICAR ÍNDICES CREADOS
-- ============================================================================

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'products'
  AND indexname IN (
    'idx_products_material',
    'idx_products_authenticity',
    'idx_products_supplier',
    'idx_products_location',
    'idx_products_acquisition_date'
  )
ORDER BY indexname;

-- ✅ PASS: Debe retornar exactamente 5 filas (todos los índices)
-- ❌ FAIL: Si retorna menos de 5, algún índice no se creó


-- ============================================================================
-- 5. VERIFICAR COMENTARIOS EN COLUMNAS
-- ============================================================================

SELECT 
  c.column_name,
  pgd.description
FROM pg_catalog.pg_statio_all_tables AS st
INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid = st.relid)
INNER JOIN information_schema.columns c ON (
  pgd.objsubid = c.ordinal_position AND 
  c.table_schema = st.schemaname AND 
  c.table_name = st.relname
)
WHERE st.relname = 'products'
  AND c.column_name IN (
    'material', 'condition_notes', 'authenticity_verified',
    'included_accessories', 'cost_price', 'additional_costs',
    'supplier_name', 'acquisition_date', 'physical_location',
    'internal_notes', 'certificate_notes', 'serial_number'
  )
ORDER BY c.column_name;

-- ✅ PASS: Debe retornar 12 filas con descripciones
-- ❌ FAIL: Si retorna menos de 12, faltan comentarios


-- ============================================================================
-- 6. VERIFICAR QUE NO AFECTÓ PRODUCTOS EXISTENTES
-- ============================================================================

-- Verificar que productos existentes siguen teniendo sus datos originales
SELECT 
  id,
  title,
  price,
  is_published,
  stock,
  -- Nuevas columnas (deben ser NULL o defaults)
  material,
  authenticity_verified,
  cost_price,
  additional_costs
FROM products
LIMIT 5;

-- ✅ PASS: Productos existentes tienen datos originales intactos
-- ❌ FAIL: Si datos originales están null o corruptos


-- ============================================================================
-- 7. VERIFICAR QUE COLUMNAS INTERNAS NO ESTÁN EN PRODUCT_PUBLIC_FIELDS
-- ============================================================================

-- Esta verificación debe hacerse manualmente en el código:
-- Revisar /src/lib/products-public-fields.ts
-- 
-- ❌ NO deben aparecer:
--   - cost_price
--   - additional_costs
--   - supplier_name
--   - acquisition_date
--   - physical_location
--   - internal_notes
--   - certificate_notes
--   - serial_number
-- 
-- ✅ OPCIONAL agregar (son públicas):
--   - material
--   - condition_notes
--   - authenticity_verified
--   - included_accessories
-- 
-- Por ahora, mantener PRODUCT_PUBLIC_FIELDS SIN cambios hasta MVP.1B-UI


-- ============================================================================
-- 8. TEST DE INSERT CON NUEVAS COLUMNAS
-- ============================================================================

-- Test inserción con columnas públicas
BEGIN;

INSERT INTO products (
  slug,
  title,
  brand,
  category,
  price,
  currency,
  condition,
  is_published,
  -- Nuevas columnas públicas
  material,
  condition_notes,
  authenticity_verified,
  included_accessories
) VALUES (
  'test-migration-mvp1a',
  'Test MVP.1A Migration',
  'Test Brand',
  'bolsas',
  1000.00,
  'MXN',
  'excelente',
  false, -- no publicar test
  'Cuero genuino italiano',
  'Producto de prueba - eliminar después de validación',
  true,
  'Polvo bag, certificado de autenticidad'
);

-- Verificar que se insertó correctamente
SELECT 
  id,
  slug,
  title,
  material,
  condition_notes,
  authenticity_verified,
  included_accessories,
  cost_price, -- debe ser NULL
  additional_costs -- debe ser {}
FROM products
WHERE slug = 'test-migration-mvp1a';

-- ✅ PASS: Producto insertado con nuevas columnas
-- ❌ FAIL: Si falla insert, hay problema con constraints/defaults

ROLLBACK; -- No commitear el test


-- ============================================================================
-- 9. TEST DE INSERT CON COLUMNAS INTERNAS
-- ============================================================================

-- Test inserción con columnas internas
BEGIN;

INSERT INTO products (
  slug,
  title,
  brand,
  category,
  price,
  currency,
  condition,
  is_published,
  -- Nuevas columnas internas
  cost_price,
  additional_costs,
  supplier_name,
  acquisition_date,
  physical_location,
  internal_notes,
  certificate_notes,
  serial_number
) VALUES (
  'test-internal-mvp1a',
  'Test Internal MVP.1A',
  'Test Brand',
  'bolsas',
  5000.00,
  'MXN',
  'excelente',
  false,
  3500.00, -- cost_price
  '{"shipping": 300, "customs": 200}'::jsonb, -- additional_costs
  'Proveedor Test SA',
  '2026-05-01',
  'Estante A1',
  'Notas internas de prueba',
  'Certificado #12345',
  'SN-TEST-001'
);

-- Verificar que se insertó correctamente
SELECT 
  id,
  slug,
  title,
  cost_price,
  additional_costs,
  supplier_name,
  acquisition_date,
  physical_location,
  internal_notes,
  certificate_notes,
  serial_number
FROM products
WHERE slug = 'test-internal-mvp1a';

-- ✅ PASS: Producto insertado con columnas internas
-- ❌ FAIL: Si falla insert, hay problema con tipos/constraints

ROLLBACK; -- No commitear el test


-- ============================================================================
-- 10. RESUMEN VALIDACIÓN
-- ============================================================================

-- Ejecutar esta query final para resumen:
SELECT 
  'Columnas agregadas' AS check_name,
  COUNT(*) AS result,
  12 AS expected,
  CASE WHEN COUNT(*) = 12 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN (
    'material', 'condition_notes', 'authenticity_verified',
    'included_accessories', 'cost_price', 'additional_costs',
    'supplier_name', 'acquisition_date', 'physical_location',
    'internal_notes', 'certificate_notes', 'serial_number'
  )

UNION ALL

SELECT 
  'Índices creados' AS check_name,
  COUNT(*) AS result,
  5 AS expected,
  CASE WHEN COUNT(*) = 5 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM pg_indexes
WHERE tablename = 'products'
  AND indexname IN (
    'idx_products_material', 'idx_products_authenticity',
    'idx_products_supplier', 'idx_products_location',
    'idx_products_acquisition_date'
  )

UNION ALL

SELECT 
  'Productos existentes intactos' AS check_name,
  COUNT(*) AS result,
  COUNT(*) AS expected, -- debe coincidir
  '✅ PASS' AS status
FROM products
WHERE title IS NOT NULL AND price IS NOT NULL;

-- ✅ PASS si las 3 filas muestran status='✅ PASS'
-- ❌ FAIL si alguna muestra '❌ FAIL'


-- ============================================================================
-- FIN VALIDACIONES
-- ============================================================================
-- 
-- Si TODOS los checks son PASS:
-- ✅ Migración MVP.1A ejecutada correctamente
-- ✅ Listo para documentar en PROJECT_STATE.md
-- ✅ Listo para MVP.1B (UI de formulario admin)
-- 
-- Si algún check es FAIL:
-- ❌ NO continuar con MVP.1B
-- ❌ Revisar logs de la migración
-- ❌ Considerar ejecutar ROLLBACK y re-intentar
-- ============================================================================
