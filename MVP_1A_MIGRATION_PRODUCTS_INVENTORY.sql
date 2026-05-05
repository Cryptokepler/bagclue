-- ============================================================================
-- MVP.1A — ADMIN INVENTARIO: SQL MIGRATION PRODUCTS
-- ============================================================================
-- Fecha: 2026-05-05
-- Propósito: Agregar columnas de inventario y gestión interna a products
-- 
-- Columnas públicas (visibles en catálogo):
--   - material, condition_notes, authenticity_verified, included_accessories
-- 
-- Columnas internas (solo admin):
--   - cost_price, additional_costs, supplier_name, acquisition_date,
--     physical_location, internal_notes, certificate_notes, serial_number
-- 
-- IMPORTANTE:
-- - Todas las columnas son NULLABLE o tienen defaults seguros
-- - NO tocar columnas existentes
-- - NO tocar RLS
-- - Las columnas internas NO deben estar en PRODUCT_PUBLIC_FIELDS
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. COLUMNAS PÚBLICAS (para catálogo/detalle producto)
-- ============================================================================

-- Material del producto (e.g., "Cuero genuino", "Lona monogram", "Acero inoxidable")
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS material TEXT;

COMMENT ON COLUMN products.material IS 'Material principal del producto (público en catálogo)';

-- Notas sobre condición visible al cliente (e.g., "Ligero desgaste en esquinas")
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS condition_notes TEXT;

COMMENT ON COLUMN products.condition_notes IS 'Descripción detallada de la condición (público)';

-- Verificación de autenticidad (badge verde en catálogo)
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS authenticity_verified BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN products.authenticity_verified IS 'Si se verificó autenticidad (público, muestra badge)';

-- Accesorios incluidos (e.g., "Llave, candado original, polvo bag")
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS included_accessories TEXT;

COMMENT ON COLUMN products.included_accessories IS 'Lista de accesorios adicionales incluidos (público)';


-- ============================================================================
-- 2. COLUMNAS INTERNAS (solo admin, NUNCA en PRODUCT_PUBLIC_FIELDS)
-- ============================================================================

-- Precio de costo/adquisición
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2);

COMMENT ON COLUMN products.cost_price IS 'Precio de costo (INTERNO - solo admin)';

-- Costos adicionales (envío, restauración, etc.) en formato JSONB flexible
-- Ejemplo: {"shipping": 500, "restoration": 1200, "customs": 300}
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS additional_costs JSONB DEFAULT '{}';

COMMENT ON COLUMN products.additional_costs IS 'Costos adicionales en JSON (INTERNO - solo admin)';

-- Nombre del proveedor/fuente
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS supplier_name TEXT;

COMMENT ON COLUMN products.supplier_name IS 'Proveedor o fuente de adquisición (INTERNO - solo admin)';

-- Fecha de adquisición del producto
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS acquisition_date DATE;

COMMENT ON COLUMN products.acquisition_date IS 'Fecha de compra/adquisición (INTERNO - solo admin)';

-- Ubicación física en bodega/tienda (e.g., "Estante A3", "Vitrina 2")
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS physical_location TEXT;

COMMENT ON COLUMN products.physical_location IS 'Ubicación física del inventario (INTERNO - solo admin)';

-- Notas internas generales (no visibles al cliente)
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;

COMMENT ON COLUMN products.internal_notes IS 'Notas internas de gestión (INTERNO - solo admin)';

-- Notas sobre certificados de autenticidad
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS certificate_notes TEXT;

COMMENT ON COLUMN products.certificate_notes IS 'Detalles de certificados/verificación (INTERNO - solo admin)';

-- Número de serie del producto (si aplica)
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS serial_number TEXT;

COMMENT ON COLUMN products.serial_number IS 'Número de serie o identificador único (INTERNO - solo admin)';


-- ============================================================================
-- 3. ÍNDICES (para queries admin rápidas)
-- ============================================================================

-- Índice para búsqueda por material
CREATE INDEX IF NOT EXISTS idx_products_material ON products(material);

-- Índice para filtro de autenticidad verificada
CREATE INDEX IF NOT EXISTS idx_products_authenticity ON products(authenticity_verified);

-- Índice para búsqueda por proveedor
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_name);

-- Índice para búsqueda por ubicación física
CREATE INDEX IF NOT EXISTS idx_products_location ON products(physical_location);

-- Índice para ordenamiento por fecha de adquisición
CREATE INDEX IF NOT EXISTS idx_products_acquisition_date ON products(acquisition_date);


-- ============================================================================
-- 4. VALIDACIÓN (verificar que no hay problemas)
-- ============================================================================

-- Verificar que las columnas se crearon correctamente
DO $$
DECLARE
  missing_columns TEXT[];
  expected_columns TEXT[] := ARRAY[
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
  FOREACH col IN ARRAY expected_columns
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = col
    ) THEN
      missing_columns := array_append(missing_columns, col);
    END IF;
  END LOOP;
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Migración falló: columnas faltantes: %', missing_columns;
  END IF;
  
  RAISE NOTICE 'Migración MVP.1A completada: 12 columnas agregadas correctamente';
END $$;

COMMIT;
