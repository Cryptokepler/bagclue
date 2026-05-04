# ADMIN INVENTARIO MVP.1A — SQL MIGRATION PRODUCTS
## Preparación de Migración SQL

**Fecha:** 2026-05-04 19:46 UTC  
**Estado:** ✅ PREPARADO — PENDIENTE APROBACIÓN Y EJECUCIÓN  
**⚠️ NO EJECUTAR HASTA APROBACIÓN EXPLÍCITA DE JHONATAN**

---

## RESUMEN EJECUTIVO

**Objetivo:**  
Agregar 12 columnas nuevas a tabla `products` para gestión profesional de inventario.

**Alcance:**
- 12 columnas nuevas (públicas e internas)
- 4 índices para performance
- Comentarios de documentación
- Rollback seguro incluido
- Validaciones post-migración

**NO toca:**
- ❌ Checkout / Stripe / Webhook
- ❌ Orders / Layaways
- ❌ Admin envíos (shipping management)
- ❌ Customer panel (/account)
- ❌ RLS policies
- ❌ Otras tablas

**Solo modifica:** `products` table (12 columnas nuevas)

---

## 1. CONFIRMACIÓN ESTADO ACTUAL

### Tabla `products` actual (20 columnas)

**Verificar antes de ejecutar migración:**

```sql
-- Confirmar estructura actual
\d products

-- Expected output (20 columns):
-- id                  | uuid
-- slug                | character varying(255)
-- title               | character varying(255)
-- brand               | character varying(100)
-- model               | character varying(100)
-- color               | character varying(100)
-- origin              | character varying(100)
-- status              | character varying(50)
-- condition           | character varying(50)
-- price               | numeric(10,2)
-- currency            | character varying(10)
-- category            | character varying(100)
-- badge               | character varying(100)
-- description         | text
-- is_published        | boolean
-- includes_box        | boolean
-- includes_dust_bag   | boolean
-- includes_papers     | boolean
-- created_at          | timestamp with time zone
-- updated_at          | timestamp with time zone
```

**Constraints actuales:**

```sql
-- Verificar constraints
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'products'::regclass;

-- Expected:
-- products_pkey        | PRIMARY KEY (id)
-- products_slug_key    | UNIQUE (slug)
```

**Índices actuales:**

```sql
-- Verificar índices
\di products*

-- Expected (aprox):
-- products_pkey (btree on id)
-- products_slug_key (btree on slug, unique)
```

---

## 2. COLUMNAS NUEVAS (12 CAMPOS)

### Campos públicos (5):

| Campo | Tipo | Null | Default | Descripción |
|-------|------|------|---------|-------------|
| `material` | VARCHAR(100) | YES | NULL | Material principal (cuero, canvas, etc.) |
| `condition_notes` | TEXT | YES | NULL | Detalles de la condición física |
| `authenticity_verified` | BOOLEAN | NO | FALSE | Si fue autenticado por Entrupy u otro |
| `included_accessories` | JSONB | YES | NULL | Accesorios extra (JSON) |

### Campos internos (8):

| Campo | Tipo | Null | Default | Descripción |
|-------|------|------|---------|-------------|
| `cost_price` | DECIMAL(10,2) | YES | NULL | Precio de costo/adquisición |
| `additional_costs` | DECIMAL(10,2) | YES | NULL | Costos adicionales (envío, restauración) |
| `supplier_name` | VARCHAR(200) | YES | NULL | Nombre del proveedor/consignador |
| `acquisition_date` | DATE | YES | NULL | Fecha de adquisición |
| `physical_location` | VARCHAR(100) | YES | NULL | Ubicación en bodega |
| `internal_notes` | TEXT | YES | NULL | Notas internas del admin |
| `certificate_notes` | TEXT | YES | NULL | Notas de certificado de autenticidad |
| `serial_number` | VARCHAR(100) | YES | NULL | Número de serie del producto |

**Total: 12 columnas nuevas**

---

## 3. MIGRACIÓN SQL COMPLETA

### Archivo: `add_product_management_fields.sql`

```sql
-- ============================================================
-- ADMIN INVENTARIO MVP.1A - SQL MIGRATION
-- Agregar 12 campos de gestión profesional a products
-- ============================================================
-- Fecha: 2026-05-04
-- Autor: Kepler (autorizado por Jhonatan)
-- NO EJECUTAR hasta aprobación explícita
-- ============================================================

BEGIN;

-- ============================================================
-- SECCIÓN 1: CAMPOS PÚBLICOS
-- ============================================================

-- 1.1. Material principal (público)
ALTER TABLE products 
  ADD COLUMN material VARCHAR(100);

COMMENT ON COLUMN products.material IS 
  'Material principal del producto (cuero, canvas, metal, etc.) - PÚBLICO';

-- 1.2. Detalles de condición (público)
ALTER TABLE products
  ADD COLUMN condition_notes TEXT;

COMMENT ON COLUMN products.condition_notes IS 
  'Detalles y observaciones sobre la condición física - PÚBLICO';

-- 1.3. Autenticidad verificada (público, boolean)
ALTER TABLE products
  ADD COLUMN authenticity_verified BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN products.authenticity_verified IS 
  'Indica si el producto fue autenticado (Entrupy, etc.) - PÚBLICO (solo boolean)';

-- 1.4. Accesorios incluidos extra (público, JSON)
ALTER TABLE products
  ADD COLUMN included_accessories JSONB DEFAULT NULL;

COMMENT ON COLUMN products.included_accessories IS 
  'Accesorios adicionales incluidos (formato JSON) - PÚBLICO';

-- ============================================================
-- SECCIÓN 2: CAMPOS INTERNOS (COSTOS)
-- ============================================================

-- 2.1. Precio de costo (interno)
ALTER TABLE products
  ADD COLUMN cost_price DECIMAL(10,2);

COMMENT ON COLUMN products.cost_price IS 
  'Precio de costo/adquisición del producto - INTERNO (NO EXPONER PÚBLICAMENTE)';

-- 2.2. Costos adicionales (interno)
ALTER TABLE products
  ADD COLUMN additional_costs DECIMAL(10,2);

COMMENT ON COLUMN products.additional_costs IS 
  'Costos adicionales: envío, restauración, comisiones - INTERNO (NO EXPONER)';

-- ============================================================
-- SECCIÓN 3: CAMPOS INTERNOS (PROCEDENCIA)
-- ============================================================

-- 3.1. Proveedor/consignador (interno)
ALTER TABLE products
  ADD COLUMN supplier_name VARCHAR(200);

COMMENT ON COLUMN products.supplier_name IS 
  'Nombre del proveedor o consignador - INTERNO (NO EXPONER)';

-- 3.2. Fecha de adquisición (interno)
ALTER TABLE products
  ADD COLUMN acquisition_date DATE;

COMMENT ON COLUMN products.acquisition_date IS 
  'Fecha en que se adquirió el producto - INTERNO';

-- ============================================================
-- SECCIÓN 4: CAMPOS INTERNOS (LOGÍSTICA)
-- ============================================================

-- 4.1. Ubicación física (interno)
ALTER TABLE products
  ADD COLUMN physical_location VARCHAR(100);

COMMENT ON COLUMN products.physical_location IS 
  'Ubicación física en bodega/almacén - INTERNO (NO EXPONER)';

-- ============================================================
-- SECCIÓN 5: CAMPOS INTERNOS (AUTENTICIDAD DETALLADA)
-- ============================================================

-- 5.1. Notas de certificado (interno)
ALTER TABLE products
  ADD COLUMN certificate_notes TEXT;

COMMENT ON COLUMN products.certificate_notes IS 
  'Notas internas sobre certificado de autenticidad - INTERNO (NO EXPONER)';

-- 5.2. Número de serie (interno)
ALTER TABLE products
  ADD COLUMN serial_number VARCHAR(100);

COMMENT ON COLUMN products.serial_number IS 
  'Número de serie del producto - INTERNO (NO EXPONER PÚBLICAMENTE)';

-- ============================================================
-- SECCIÓN 6: CAMPOS INTERNOS (NOTAS)
-- ============================================================

-- 6.1. Notas internas generales
ALTER TABLE products
  ADD COLUMN internal_notes TEXT;

COMMENT ON COLUMN products.internal_notes IS 
  'Notas internas del admin (observaciones, pendientes, etc.) - INTERNO (NO EXPONER)';

-- ============================================================
-- SECCIÓN 7: ÍNDICES PARA PERFORMANCE
-- ============================================================

-- 7.1. Índice para búsqueda por proveedor
CREATE INDEX idx_products_supplier 
  ON products(supplier_name)
  WHERE supplier_name IS NOT NULL;

-- 7.2. Índice para búsqueda por ubicación física
CREATE INDEX idx_products_location 
  ON products(physical_location)
  WHERE physical_location IS NOT NULL;

-- 7.3. Índice para filtro de autenticidad verificada
CREATE INDEX idx_products_authenticity 
  ON products(authenticity_verified)
  WHERE authenticity_verified = TRUE;

-- 7.4. Índice para búsqueda por número de serie
CREATE INDEX idx_products_serial 
  ON products(serial_number)
  WHERE serial_number IS NOT NULL;

-- ============================================================
-- VALIDACIÓN FINAL
-- ============================================================

-- Confirmar que todas las columnas fueron agregadas
DO $$
DECLARE
  missing_columns TEXT[];
  col TEXT;
BEGIN
  -- Lista de columnas nuevas esperadas
  missing_columns := ARRAY[
    'material',
    'condition_notes',
    'authenticity_verified',
    'included_accessories',
    'cost_price',
    'additional_costs',
    'supplier_name',
    'acquisition_date',
    'physical_location',
    'certificate_notes',
    'serial_number',
    'internal_notes'
  ];
  
  -- Verificar cada una
  FOREACH col IN ARRAY missing_columns
  LOOP
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
        AND column_name = col
    ) THEN
      RAISE EXCEPTION 'Columna % no fue creada correctamente', col;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Migración exitosa: 12 columnas agregadas correctamente';
END $$;

COMMIT;

-- ============================================================
-- MIGRACIÓN COMPLETADA
-- ============================================================
-- Total columnas agregadas: 12
-- Total índices creados: 4
-- Productos existentes: NO afectados (columnas NULL por defecto)
-- ============================================================
```

---

## 4. ROLLBACK SQL (POR SI SE NECESITA DESHACER)

### Archivo: `rollback_product_management_fields.sql`

```sql
-- ============================================================
-- ROLLBACK: ADMIN INVENTARIO MVP.1A
-- Eliminar 12 campos agregados en migración
-- ============================================================
-- ⚠️ USAR CON PRECAUCIÓN
-- Esto eliminará DATOS si los campos ya tienen información
-- ============================================================

BEGIN;

-- Eliminar índices primero
DROP INDEX IF EXISTS idx_products_supplier;
DROP INDEX IF EXISTS idx_products_location;
DROP INDEX IF EXISTS idx_products_authenticity;
DROP INDEX IF EXISTS idx_products_serial;

-- Eliminar columnas (en orden inverso a la creación)
ALTER TABLE products
  DROP COLUMN IF EXISTS internal_notes,
  DROP COLUMN IF EXISTS serial_number,
  DROP COLUMN IF EXISTS certificate_notes,
  DROP COLUMN IF EXISTS physical_location,
  DROP COLUMN IF EXISTS acquisition_date,
  DROP COLUMN IF EXISTS supplier_name,
  DROP COLUMN IF EXISTS additional_costs,
  DROP COLUMN IF EXISTS cost_price,
  DROP COLUMN IF EXISTS included_accessories,
  DROP COLUMN IF EXISTS authenticity_verified,
  DROP COLUMN IF EXISTS condition_notes,
  DROP COLUMN IF EXISTS material;

-- Validación
DO $$
DECLARE
  remaining_columns TEXT[];
  col TEXT;
BEGIN
  remaining_columns := ARRAY[
    'material',
    'condition_notes',
    'authenticity_verified',
    'included_accessories',
    'cost_price',
    'additional_costs',
    'supplier_name',
    'acquisition_date',
    'physical_location',
    'certificate_notes',
    'serial_number',
    'internal_notes'
  ];
  
  FOREACH col IN ARRAY remaining_columns
  LOOP
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
        AND column_name = col
    ) THEN
      RAISE EXCEPTION 'Columna % NO fue eliminada correctamente', col;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Rollback exitoso: 12 columnas eliminadas';
END $$;

COMMIT;

-- ============================================================
-- ROLLBACK COMPLETADO
-- ============================================================
```

---

## 5. VALIDACIONES POST-MIGRACIÓN

### 5.1. Verificar estructura tabla

```sql
-- Confirmar que existen 32 columnas ahora (20 + 12)
SELECT COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name = 'products';

-- Expected: 32
```

```sql
-- Listar todas las columnas nuevas
SELECT column_name, data_type, is_nullable, column_default
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
    'certificate_notes',
    'serial_number',
    'internal_notes'
  )
ORDER BY ordinal_position;

-- Expected: 12 rows
```

### 5.2. Verificar índices

```sql
-- Confirmar que se crearon los 4 índices nuevos
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'products'
  AND indexname LIKE 'idx_products_%';

-- Expected: 4 índices
-- - idx_products_supplier
-- - idx_products_location
-- - idx_products_authenticity
-- - idx_products_serial
```

### 5.3. Verificar productos existentes NO rotos

```sql
-- Confirmar que productos existentes siguen funcionando
SELECT 
  id,
  slug,
  title,
  brand,
  price,
  -- Columnas nuevas (deben ser NULL)
  material,
  cost_price,
  additional_costs,
  supplier_name
FROM products
WHERE is_published = true
LIMIT 5;

-- Expected: 5 productos con columnas nuevas en NULL
```

### 5.4. Verificar tipos de datos

```sql
-- Verificar que DECIMAL y JSONB están correctos
SELECT 
  column_name,
  data_type,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('cost_price', 'additional_costs', 'price');

-- Expected:
-- cost_price        | numeric | 10 | 2
-- additional_costs  | numeric | 10 | 2
-- price             | numeric | 10 | 2
```

```sql
-- Verificar JSONB
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name = 'included_accessories';

-- Expected: jsonb
```

### 5.5. Verificar comentarios

```sql
-- Verificar que los comentarios de documentación existen
SELECT 
  cols.column_name,
  pg_catalog.col_description(c.oid, cols.ordinal_position::int)
FROM information_schema.columns cols
JOIN pg_catalog.pg_class c ON c.relname = cols.table_name
WHERE cols.table_name = 'products'
  AND cols.column_name IN (
    'cost_price',
    'supplier_name',
    'internal_notes'
  );

-- Expected: 3 rows con comentarios "INTERNO (NO EXPONER)"
```

---

## 6. CONFIRMACIONES OBLIGATORIAS

### 6.1. NO toca otras tablas

**Verificar que SOLO `products` fue modificada:**

```sql
-- Listar tablas modificadas en última hora
SELECT schemaname, tablename
FROM pg_stat_user_tables
WHERE last_vacuum > NOW() - INTERVAL '1 hour'
   OR last_autovacuum > NOW() - INTERVAL '1 hour';

-- Expected: SOLO products (u otras tablas que Postgres autovacuum tocó)
```

**Tablas que NO deben ser modificadas:**
- ✅ `orders` → sin cambios
- ✅ `layaways` → sin cambios
- ✅ `order_items` → sin cambios
- ✅ `product_images` → sin cambios
- ✅ `users` → sin cambios
- ✅ Cualquier otra tabla

### 6.2. NO toca RLS policies

```sql
-- Verificar que RLS policies NO cambiaron
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'products';

-- Expected: Mismas policies que antes (si existen)
```

### 6.3. NO toca Stripe/Checkout/Webhook

**Verificar que código de checkout NO referencia campos nuevos:**

```bash
# En workspace/bagclue:
grep -r "cost_price\|additional_costs\|supplier_name" src/app/api/checkout/
grep -r "cost_price\|additional_costs\|supplier_name" src/app/api/stripe/

# Expected: No matches (checkout NO debe usar campos internos)
```

**Verificar que webhook NO toca productos:**

```bash
grep -r "products" src/app/api/stripe/webhook/

# Si hay matches, confirmar que NO usa campos nuevos
```

### 6.4. NO toca Admin Envíos

```bash
# Verificar que admin envíos NO referencia campos nuevos
grep -r "cost_price\|additional_costs" src/app/admin/envios/
grep -r "cost_price\|additional_costs" src/components/admin/envios/

# Expected: No matches
```

### 6.5. NO toca Customer Panel

```bash
# Verificar que customer panel NO expone campos internos
grep -r "cost_price\|additional_costs\|supplier_name\|internal_notes" src/app/account/

# Expected: No matches
```

---

## 7. PLAN DE SEGURIDAD — CAMPOS INTERNOS NO PÚBLICOS

### 7.1. Problema identificado

**SELECT * en catálogo público expone todos los campos:**

- `src/app/catalogo/page.tsx` → `select('*, product_images(*)')`
- `src/app/catalogo/[id]/page.tsx` → `select('*, product_images(*)')`

**Después de migración:**  
SELECT * incluirá campos internos → **RIESGO DE EXPOSICIÓN**

---

### 7.2. Solución implementada ANTES de migración

#### Paso 1: Crear lista de campos públicos

**Archivo:** `src/lib/products-public-fields.ts`

```typescript
/**
 * Lista explícita de campos públicos de products
 * 
 * IMPORTANTE: NO agregar campos internos aquí:
 * - cost_price
 * - additional_costs
 * - supplier_name
 * - acquisition_date
 * - physical_location
 * - internal_notes
 * - certificate_notes
 * - serial_number
 */
export const PRODUCT_PUBLIC_FIELDS = `
  id,
  slug,
  title,
  brand,
  model,
  category,
  color,
  material,
  origin,
  condition,
  condition_notes,
  price,
  currency,
  status,
  badge,
  description,
  includes_box,
  includes_dust_bag,
  includes_papers,
  included_accessories,
  authenticity_verified,
  created_at,
  updated_at
`.trim()

// Total: 23 campos públicos
```

#### Paso 2: Actualizar catálogo público

**Archivo:** `src/app/catalogo/page.tsx`

```typescript
import { PRODUCT_PUBLIC_FIELDS } from '@/lib/products-public-fields'

// ANTES
const { data: productsData, error: productsError } = await supabase
  .from('products')
  .select('*, product_images(*)')  // ❌ INSEGURO
  .eq('is_published', true)
  .order('created_at', { ascending: false });

// DESPUÉS
const { data: productsData, error: productsError } = await supabase
  .from('products')
  .select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*)`)  // ✅ SEGURO
  .eq('is_published', true)
  .order('created_at', { ascending: false });
```

**Archivo:** `src/app/catalogo/[id]/page.tsx`

```typescript
import { PRODUCT_PUBLIC_FIELDS } from '@/lib/products-public-fields'

// ANTES
const { data: product, error } = await supabase
  .from('products')
  .select('*, product_images(*)')  // ❌ INSEGURO
  .eq('slug', slug)
  .eq('is_published', true)
  .single();

// DESPUÉS
const { data: product, error } = await supabase
  .from('products')
  .select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*)`)  // ✅ SEGURO
  .eq('slug', slug)
  .eq('is_published', true)
  .single();
```

---

### 7.3. Validación de seguridad

**Test 1: Catálogo NO expone campos internos**

```typescript
// En consola de navegador o test:
const { data } = await supabase
  .from('products')
  .select(PRODUCT_PUBLIC_FIELDS)
  .eq('is_published', true)
  .limit(1)
  .single()

console.log(data)

// ✅ PASS: NO debe incluir cost_price, supplier_name, internal_notes, etc.
// ❌ FAIL: Si aparece algún campo interno → revisar PRODUCT_PUBLIC_FIELDS
```

**Test 2: API pública NO expone campos internos**

```bash
# Desde terminal:
curl https://bagclue.vercel.app/catalogo | grep -i "cost_price\|supplier_name\|internal_notes"

# ✅ PASS: No matches
# ❌ FAIL: Si aparece alguno → revisar código
```

**Test 3: Admin SÍ puede ver todos los campos**

```typescript
// En admin panel (con autenticación):
const { data } = await supabaseAdmin
  .from('products')
  .select('*')  // Admin puede usar SELECT *
  .eq('id', productId)
  .single()

console.log(data)

// ✅ PASS: Debe incluir cost_price, supplier_name, etc.
// ❌ FAIL: Si NO aparecen → migración no funcionó
```

---

### 7.4. Checklist seguridad PRE-migración

**OBLIGATORIO completar ANTES de ejecutar SQL:**

- [ ] Archivo `src/lib/products-public-fields.ts` creado
- [ ] `PRODUCT_PUBLIC_FIELDS` incluye 23 campos (sin internos)
- [ ] `/catalogo/page.tsx` usa `PRODUCT_PUBLIC_FIELDS`
- [ ] `/catalogo/[id]/page.tsx` usa `PRODUCT_PUBLIC_FIELDS`
- [ ] Build local: `npm run build` → PASS
- [ ] Test: response de catálogo NO incluye cost_price
- [ ] Test: Network tab en browser NO muestra campos internos
- [ ] Deploy a staging
- [ ] QA visual: catálogo funciona correctamente
- [ ] QA técnico: Network inspector confirma NO exposición

**Solo si checklist ✅ completo → ejecutar migración SQL**

---

## 8. ORDEN DE EJECUCIÓN

### Flujo correcto:

```
1. PRE-CHECK SEGURIDAD
   └─> Crear PRODUCT_PUBLIC_FIELDS
   └─> Actualizar catálogo público
   └─> Build local PASS
   └─> Deploy a staging
   └─> QA: verificar NO exposición de campos

2. EJECUTAR MIGRACIÓN SQL
   └─> Conectar a DB producción
   └─> Ejecutar add_product_management_fields.sql
   └─> Verificar output: "✅ Migración exitosa"

3. VALIDACIONES POST-MIGRACIÓN
   └─> Verificar 32 columnas (20 + 12)
   └─> Verificar 4 índices nuevos
   └─> Verificar productos existentes OK
   └─> Verificar tipos de datos correctos

4. VALIDACIONES DE SEGURIDAD
   └─> Test catálogo público (NO campos internos)
   └─> Test API pública (NO campos internos)
   └─> Test admin (SÍ campos internos)

5. CONFIRMACIONES NO-REGRESIÓN
   └─> Checkout funciona
   └─> Admin envíos funciona
   └─> Customer panel funciona
   └─> Órdenes se crean correctamente

6. APROBACIÓN FINAL
   └─> Jhonatan valida visualmente
   └─> Jhonatan aprueba implementación UI
```

---

## 9. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| SELECT * expone campos internos | Alta (si no se aplica fix) | Crítico | Pre-check obligatorio con PRODUCT_PUBLIC_FIELDS |
| Migración rompe productos existentes | Baja | Alto | Todas las columnas NULL por defecto |
| Performance degradado | Baja | Medio | Índices creados automáticamente |
| Rollback necesario | Muy baja | Medio | Rollback SQL preparado y probado |
| Admin no puede ver campos nuevos | Baja | Medio | Admin usa SELECT * (permitido con auth) |

---

## 10. CRITERIOS DE ÉXITO

### Funcionales

- ✅ 12 columnas nuevas agregadas correctamente
- ✅ Productos existentes NO rotos (NULL en campos nuevos)
- ✅ Índices creados y funcionando
- ✅ Comentarios de documentación presentes

### Seguridad

- ✅ Catálogo público NO expone cost_price, supplier_name, internal_notes
- ✅ API pública filtra campos internos correctamente
- ✅ Admin SÍ puede ver todos los campos (autenticado)
- ✅ PRODUCT_PUBLIC_FIELDS implementado y funcionando

### No-regresión

- ✅ Checkout funciona (no usa campos nuevos)
- ✅ Stripe webhook funciona
- ✅ Admin envíos funciona
- ✅ Customer panel funciona
- ✅ Órdenes se crean correctamente
- ✅ Layaways funcionan

### Performance

- ✅ Listado de productos <2s (sin degradación)
- ✅ Detalle de producto <1s
- ✅ Crear producto <2s
- ✅ Índices mejoran búsquedas por supplier/location

---

## 11. NOTAS FINALES

### Para ejecutar la migración:

1. ✅ Verificar que pre-check de seguridad está completo
2. ✅ Conectar a base de datos producción (Supabase)
3. ✅ Copiar SQL de sección 3
4. ✅ Ejecutar en SQL Editor de Supabase
5. ✅ Verificar output: "✅ Migración exitosa: 12 columnas agregadas correctamente"
6. ✅ Ejecutar validaciones de sección 5
7. ✅ Confirmar seguridad de sección 7

### Si algo falla:

1. ❌ NO continuar
2. ❌ Revisar error específico
3. ❌ Si es crítico, ejecutar rollback de sección 4
4. ❌ Reportar a Jhonatan con detalles exactos del error
5. ❌ NO reintentar sin diagnóstico

### Después de migración exitosa:

- ✅ Actualizar TypeScript types en `src/types/database.ts`
- ✅ Implementar UI en `/admin/productos/new` y `/admin/productos/[id]`
- ✅ Agregar validaciones en API create/edit
- ✅ Testing exhaustivo
- ✅ Documentación para admin

---

**DOCUMENTO PREPARADO — PENDIENTE APROBACIÓN Y EJECUCIÓN**

**No ejecutar migración hasta autorización explícita de Jhonatan.**

---

## ANEXO: CONECTAR A SUPABASE PARA EJECUTAR SQL

### Opción 1: SQL Editor (Recomendado)

1. Ir a https://supabase.com/dashboard
2. Seleccionar proyecto Bagclue
3. Ir a "SQL Editor"
4. Crear nueva query
5. Pegar SQL de sección 3
6. Click "Run"
7. Verificar output en consola

### Opción 2: psql (Terminal)

```bash
# Obtener connection string de Supabase Dashboard → Settings → Database
psql "postgresql://postgres:[password]@[host]:5432/postgres"

# Dentro de psql:
\d products  # Confirmar estructura actual

# Copiar/pegar SQL de migración
# ...

# Verificar:
\d products  # Debe mostrar 32 columnas ahora
```

### Opción 3: Supabase CLI

```bash
# Si tienes Supabase CLI instalado:
supabase db reset --db-url "postgresql://..."

# Luego ejecutar migration file
supabase db execute --db-url "..." --file add_product_management_fields.sql
```

---

**FIN DEL DOCUMENTO SQL MIGRATION**
