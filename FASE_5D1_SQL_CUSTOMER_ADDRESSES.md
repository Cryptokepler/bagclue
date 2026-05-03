# FASE 5D.1 — SQL CUSTOMER_ADDRESSES
**Fecha:** 2026-05-03  
**Estado:** ⏸️ SQL preparado, pendiente de aprobación  
**Autor:** Kepler  
**Proyecto:** Bagclue E-commerce  

---

## 1. DECISIÓN: PHONE_COUNTRY_CODE / PHONE_COUNTRY_ISO

### ✅ RECOMENDACIÓN: SÍ AGREGAR AHORA

**Motivo:**
- Ya detectamos en checkout que teléfono necesita selector de país/código internacional
- Mejor agregarlo ahora en `customer_addresses` que migrar después
- Permite validación correcta de formato por país
- Facilita integración futura con checkout (pre-llenar teléfono con código)
- Prepara para envíos internacionales

**Campos propuestos:**
```sql
phone_country_code TEXT DEFAULT '+52',  -- Código telefónico (e.g., +52, +1, +34)
phone_country_iso TEXT DEFAULT 'MX',    -- ISO 3166-1 alpha-2 (e.g., MX, US, ES)
phone TEXT,                              -- Número sin código (e.g., 5551234567)
```

**Valores default:**
- México como país default (`+52` / `MX`)
- Editable por usuario en UI

**Alternativa:**
Si prefieres un solo campo `phone` con formato internacional completo (e.g., `+525551234567`), podemos omitir los campos separados. Pero recomiendo separar porque:
1. Facilita validación por país
2. Mejora UX con selector de país
3. Permite mostrar teléfono formateado correctamente
4. Evita errores de parsing

**DECISIÓN FINAL:** Incluyo `phone_country_code` y `phone_country_iso` en el SQL.

---

## 2. GARANTÍA DE UNA SOLA DIRECCIÓN DEFAULT POR USUARIO

### ✅ OPCIÓN A (RECOMENDADA): ÍNDICE ÚNICO PARCIAL

**SQL:**
```sql
CREATE UNIQUE INDEX idx_customer_addresses_user_default 
ON customer_addresses(user_id) 
WHERE is_default = true;
```

**Ventajas:**
- ✅ Protección a nivel DB (imposible violar constraint)
- ✅ Performance: índice parcial es eficiente (solo indexa is_default=true)
- ✅ No requiere lógica adicional en triggers
- ✅ Error claro si se intenta violar: `23505 duplicate key value`

**Desventajas:**
- ⚠️ Si backend/UI intentan marcar una segunda como default sin desmarcar la primera, DB rechaza con error
- ⚠️ Requiere lógica en backend: "antes de marcar nueva default, desmarcar la actual"

**Flujo correcto en backend:**
```javascript
// Opción 1: Transaction con 2 updates
await supabase.rpc('set_default_address', { address_id: '...' })

// Opción 2: Manual (2 queries)
// 1. Desmarcar todas las default del usuario
await supabase
  .from('customer_addresses')
  .update({ is_default: false })
  .eq('user_id', userId)
  .eq('is_default', true);

// 2. Marcar la nueva
await supabase
  .from('customer_addresses')
  .update({ is_default: true })
  .eq('id', addressId);
```

**OPCIÓN B (Alternativa): TRIGGER**

```sql
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE customer_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ensure_single_default_address
BEFORE INSERT OR UPDATE ON customer_addresses
FOR EACH ROW
EXECUTE FUNCTION ensure_single_default_address();
```

**Ventajas:**
- ✅ Backend más simple (solo marca nueva, trigger desmarca automático)
- ✅ No puede haber error de constraint violado

**Desventajas:**
- ⚠️ Lógica oculta en DB (menos explícita)
- ⚠️ Performance: trigger ejecuta UPDATE adicional en cada INSERT/UPDATE
- ⚠️ Puede enmascarar bugs en backend (el trigger "arregla" el problema en vez de fallar)

### 🎯 DECISIÓN FINAL: ÍNDICE ÚNICO PARCIAL (Opción A)

**Motivo:**
- Sigue tu preferencia explícita
- Protección DB + manejo correcto en UI/backend
- Error explícito si backend falla (mejor para debugging)
- Performance superior (no ejecuta UPDATE extra en cada operación)

**Implementación backend:**
- Crear endpoint `/api/addresses/[id]/set-default` (POST)
- Lógica: desmarcar todas las default del usuario → marcar la nueva
- Manejo de error 23505 (por si acaso) → retry con desmarque previo

---

## 3. SQL COMPLETO FINAL

### 3.1 Migración 024: Customer Addresses

```sql
-- ============================================================================
-- MIGRATION 024: CUSTOMER ADDRESSES
-- Created: 2026-05-03
-- Phase: 5D.1
-- Author: Kepler
-- 
-- Purpose: Create customer_addresses table for shipping addresses management
-- 
-- Features:
-- - User-owned addresses with RLS
-- - Country/state/city/postal fields
-- - Phone with country code (international support)
-- - Single default address per user (unique partial index)
-- - Soft references field for delivery instructions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE TABLE
-- ----------------------------------------------------------------------------

CREATE TABLE customer_addresses (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contact Information
  full_name TEXT NOT NULL,
  phone_country_code TEXT DEFAULT '+52',
  phone_country_iso TEXT DEFAULT 'MX',
  phone TEXT,
  
  -- Location
  country TEXT NOT NULL DEFAULT 'México',
  state TEXT,
  city TEXT NOT NULL,
  postal_code TEXT,
  
  -- Address
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  references TEXT, -- Delivery instructions (e.g., "blue building, black gate")
  
  -- Control
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. INDEXES
-- ----------------------------------------------------------------------------

-- Index for fast user lookup (most common query: get all addresses for user)
CREATE INDEX idx_customer_addresses_user_id 
ON customer_addresses(user_id);

-- Unique partial index: only one default address per user
CREATE UNIQUE INDEX idx_customer_addresses_user_default 
ON customer_addresses(user_id) 
WHERE is_default = true;

-- Index for default lookup (optional, but useful for set-default queries)
CREATE INDEX idx_customer_addresses_is_default 
ON customer_addresses(is_default) 
WHERE is_default = true;

-- ----------------------------------------------------------------------------
-- 3. TRIGGER FOR UPDATED_AT
-- ----------------------------------------------------------------------------

-- Assumes function update_updated_at_column() already exists
-- (created in previous migrations for orders, layaways, etc.)
-- If not, create it:

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to customer_addresses
CREATE TRIGGER set_customer_addresses_updated_at
BEFORE UPDATE ON customer_addresses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 5. RLS POLICIES
-- ----------------------------------------------------------------------------

-- Policy 1: Service Role Full Access
-- Purpose: Allow backend/admin operations with service_role key
-- Who: service_role (bypass RLS)
-- Note: This is implicit (service_role bypasses RLS by default)
-- No explicit policy needed, but documented for clarity

-- Policy 2: Customers can view their own addresses
-- Purpose: Users can only see addresses they own
-- Security: auth.uid() must match user_id
CREATE POLICY "Customers can view own addresses"
ON customer_addresses
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 3: Customers can insert their own addresses
-- Purpose: Users can only create addresses for themselves
-- Security: auth.uid() must match user_id in new row
CREATE POLICY "Customers can insert own addresses"
ON customer_addresses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Customers can update their own addresses
-- Purpose: Users can only edit addresses they own
-- Security: auth.uid() must match user_id (both in existing row and updated row)
CREATE POLICY "Customers can update own addresses"
ON customer_addresses
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 5: Customers can delete their own addresses
-- Purpose: Users can only delete addresses they own
-- Security: auth.uid() must match user_id
CREATE POLICY "Customers can delete own addresses"
ON customer_addresses
FOR DELETE
USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6. COMMENTS (Documentation)
-- ----------------------------------------------------------------------------

COMMENT ON TABLE customer_addresses IS 
'Shipping addresses for registered customers. Each user can have multiple addresses with one marked as default.';

COMMENT ON COLUMN customer_addresses.user_id IS 
'Foreign key to auth.users. Cascades on delete.';

COMMENT ON COLUMN customer_addresses.phone_country_code IS 
'International phone country code (e.g., +52, +1, +34). Defaults to +52 (Mexico).';

COMMENT ON COLUMN customer_addresses.phone_country_iso IS 
'ISO 3166-1 alpha-2 country code for phone (e.g., MX, US, ES). Defaults to MX.';

COMMENT ON COLUMN customer_addresses.phone IS 
'Phone number without country code (e.g., 5551234567).';

COMMENT ON COLUMN customer_addresses.references IS 
'Delivery instructions or location references (e.g., "between X and Y streets, blue building").';

COMMENT ON COLUMN customer_addresses.is_default IS 
'Whether this is the default shipping address. Only one address per user can be default (enforced by unique partial index).';

COMMENT ON INDEX idx_customer_addresses_user_default IS 
'Ensures only one default address per user. Partial index on (user_id) WHERE is_default = true.';

-- ----------------------------------------------------------------------------
-- END OF MIGRATION 024
-- ----------------------------------------------------------------------------
```

---

## 4. EXPLICACIÓN DE CADA POLICY

### Policy 1: Service Role Full Access
**SQL:** (Implícita, no requiere CREATE POLICY)  
**Quién:** `service_role` (backend con service key)  
**Qué puede hacer:** Bypass RLS completo (SELECT, INSERT, UPDATE, DELETE sin restricciones)  
**Por qué:** Permite operaciones admin y backend sin restricciones de ownership  
**Riesgo:** Ninguno si service key se mantiene segura en server-side  

### Policy 2: Customers can view own addresses
**SQL:**
```sql
CREATE POLICY "Customers can view own addresses"
ON customer_addresses FOR SELECT
USING (auth.uid() = user_id);
```
**Quién:** Usuario autenticado con token válido  
**Qué puede hacer:** Ver solo direcciones donde `user_id = auth.uid()`  
**Por qué:** Aislamiento entre usuarios — Usuario A no ve direcciones de Usuario B  
**Riesgo:** Ninguno, constraint correcto  

### Policy 3: Customers can insert own addresses
**SQL:**
```sql
CREATE POLICY "Customers can insert own addresses"
ON customer_addresses FOR INSERT
WITH CHECK (auth.uid() = user_id);
```
**Quién:** Usuario autenticado con token válido  
**Qué puede hacer:** Crear nuevas direcciones SOLO si `user_id` en la nueva fila coincide con `auth.uid()`  
**Por qué:** Previene que Usuario A cree direcciones en nombre de Usuario B  
**Riesgo:** Ninguno, constraint correcto  

### Policy 4: Customers can update own addresses
**SQL:**
```sql
CREATE POLICY "Customers can update own addresses"
ON customer_addresses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```
**Quién:** Usuario autenticado con token válido  
**Qué puede hacer:** Editar direcciones SOLO si:
- `USING`: La dirección existente pertenece al usuario (`auth.uid() = user_id`)
- `WITH CHECK`: La dirección modificada sigue perteneciendo al usuario (previene cambiar `user_id` a otro usuario)  
**Por qué:** Doble protección — no puede editar direcciones ajenas NI transferir dirección propia a otro usuario  
**Riesgo:** Ninguno, constraint correcto  

### Policy 5: Customers can delete own addresses
**SQL:**
```sql
CREATE POLICY "Customers can delete own addresses"
ON customer_addresses FOR DELETE
USING (auth.uid() = user_id);
```
**Quién:** Usuario autenticado con token válido  
**Qué puede hacer:** Eliminar SOLO direcciones donde `user_id = auth.uid()`  
**Por qué:** Previene que Usuario A elimine direcciones de Usuario B  
**Riesgo:** Ninguno, constraint correcto  

### Resumen de Aislamiento
- ✅ Usuario no autenticado → **0 acceso** (todas las policies requieren `auth.uid()`)
- ✅ Usuario A → Ve/edita/elimina **SOLO sus direcciones**
- ✅ Usuario B → Ve/edita/elimina **SOLO sus direcciones**
- ✅ Service role → **Acceso total** (bypass RLS)
- ✅ No hay policies públicas (`true`) ni expuestas

---

## 5. GARANTÍA DE UNA SOLA DEFAULT POR USUARIO

### Mecanismo: Índice Único Parcial

**SQL:**
```sql
CREATE UNIQUE INDEX idx_customer_addresses_user_default 
ON customer_addresses(user_id) 
WHERE is_default = true;
```

### Cómo Funciona

1. **Índice parcial:** Solo indexa filas donde `is_default = true`
2. **Constraint único:** No permite duplicados en `(user_id)` dentro del índice
3. **Resultado:** Solo puede existir UNA fila con `(user_id=X, is_default=true)`

### Ejemplos

**✅ Permitido:**
```sql
-- Usuario A tiene 3 direcciones, solo 1 default
user_id = 'aaa...', is_default = true   -- OK
user_id = 'aaa...', is_default = false  -- OK
user_id = 'aaa...', is_default = false  -- OK

-- Usuario B tiene 2 direcciones, solo 1 default
user_id = 'bbb...', is_default = true   -- OK
user_id = 'bbb...', is_default = false  -- OK
```

**❌ Rechazado:**
```sql
-- Intento de insertar segunda default para Usuario A
user_id = 'aaa...', is_default = true   -- Existente
user_id = 'aaa...', is_default = true   -- ERROR: duplicate key value violates unique constraint
```

### Error Esperado
```
ERROR: duplicate key value violates unique constraint "idx_customer_addresses_user_default"
DETAIL: Key (user_id)=(aaa...) already exists.
Code: 23505
```

### Manejo en Backend

**Endpoint:** `/api/addresses/[id]/set-default` (POST)

**Lógica correcta:**
```javascript
// Paso 1: Desmarcar todas las default del usuario
const { error: clearError } = await supabase
  .from('customer_addresses')
  .update({ is_default: false })
  .eq('user_id', userId)
  .eq('is_default', true);

// Paso 2: Marcar la nueva como default
const { error: setError } = await supabase
  .from('customer_addresses')
  .update({ is_default: true })
  .eq('id', addressId)
  .eq('user_id', userId); // Ownership check

// Paso 3: Manejo de error (por si acaso)
if (setError?.code === '23505') {
  // Constraint violado — retry con desmarque previo
  // (no debería pasar si Paso 1 funciona correctamente)
}
```

**Alternativa (RPC Function):**
```sql
CREATE OR REPLACE FUNCTION set_default_address(address_id UUID)
RETURNS void AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user_id from target address
  SELECT user_id INTO target_user_id
  FROM customer_addresses
  WHERE id = address_id;
  
  -- Clear all defaults for this user
  UPDATE customer_addresses
  SET is_default = false
  WHERE user_id = target_user_id
    AND is_default = true;
  
  -- Set new default
  UPDATE customer_addresses
  SET is_default = true
  WHERE id = address_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Ventajas del Índice vs Trigger

| Aspecto | Índice Único Parcial | Trigger |
|---------|---------------------|---------|
| **Protección DB** | ✅ Imposible violar | ✅ Imposible violar |
| **Performance** | ✅ Solo indexa is_default=true | ⚠️ UPDATE extra en cada operación |
| **Debugging** | ✅ Error explícito (23505) | ⚠️ Silencioso (auto-arregla) |
| **Transparencia** | ✅ Constraint visible en schema | ⚠️ Lógica oculta en trigger |
| **Complejidad backend** | ⚠️ Requiere 2-step update | ✅ 1-step update |

**DECISIÓN:** Índice único parcial (mejor performance, debugging explícito, sigue tu preferencia).

---

## 6. RIESGOS IDENTIFICADOS

### 6.1 Riesgo: Backend olvida desmarcar antes de marcar nueva default
**Probabilidad:** Media  
**Impacto:** Bajo (error 23505, rechaza operación)  
**Mitigación:**
- Endpoint dedicado `/api/addresses/[id]/set-default`
- Lógica 2-step: clear → set
- Test automatizado: `test-set-default-address.mjs`
- Manejo de error 23505 con retry

### 6.2 Riesgo: RLS mal configurada expone direcciones de otros usuarios
**Probabilidad:** Muy baja (SQL revisado)  
**Impacto:** Crítico (violación privacidad)  
**Mitigación:**
- 4 policies explícitas con `auth.uid() = user_id`
- Sin policies públicas (`true`)
- Test RLS: `test-rls-addresses.mjs` (verificar Usuario A no ve direcciones de Usuario B)
- Validación manual en Supabase Dashboard

### 6.3 Riesgo: Usuario borra su única dirección y queda sin default
**Probabilidad:** Alta (comportamiento normal)  
**Impacto:** Ninguno (permitido)  
**Mitigación:**
- Permitir estado "sin direcciones" (usuario puede no tener direcciones guardadas)
- Si checkout requiere dirección en futuro, validar allí (no en addresses)
- UI muestra estado vacío claro ("Aún no tienes direcciones guardadas")

### 6.4 Riesgo: Formato de teléfono incompatible con carrier/envío
**Probabilidad:** Media (formato varía por país)  
**Impacto:** Medio (problemas de contacto en envío)  
**Mitigación:**
- Campos separados: `phone_country_code`, `phone_country_iso`, `phone`
- Validación frontend con `libphonenumber-js` o similar
- Validación backend regex flexible (no rechazar formatos poco comunes)
- Campo TEXT sin constraint de formato (acepta cualquier string)

### 6.5 Riesgo: Migration falla por function update_updated_at_column() no existe
**Probabilidad:** Baja (función ya existe en migraciones previas)  
**Impacto:** Bajo (migration falla, rollback automático)  
**Mitigación:**
- SQL incluye creación de función `update_updated_at_column()` con `CREATE OR REPLACE`
- Si ya existe, se actualiza sin error
- Verificar pre-migración: `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'update_updated_at_column';`

### 6.6 Riesgo: País hardcodeado a México limita expansión internacional
**Probabilidad:** Media (expansión futura)  
**Impacto:** Bajo (solo default, editable)  
**Mitigación:**
- Campo `country` tipo TEXT (acepta cualquier país)
- Default 'México' pero editable en UI
- Validación frontend con dropdown de países (ISO 3166-1)
- Preparado para validación de `postal_code` por país en futuro

---

## 7. ROLLBACK SQL

### 7.1 SQL Completo para Revertir Migración 024

```sql
-- ============================================================================
-- ROLLBACK MIGRATION 024: CUSTOMER ADDRESSES
-- Created: 2026-05-03
-- Phase: 5D.1
-- 
-- Purpose: Completely remove customer_addresses table and related objects
-- 
-- WARNING: This will permanently delete all customer addresses data.
--          Only run if migration needs to be reverted.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DROP POLICIES
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Customers can delete own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Customers can update own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Customers can insert own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Customers can view own addresses" ON customer_addresses;

-- ----------------------------------------------------------------------------
-- 2. DROP TRIGGER
-- ----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS set_customer_addresses_updated_at ON customer_addresses;

-- ----------------------------------------------------------------------------
-- 3. DROP INDEXES
-- ----------------------------------------------------------------------------

DROP INDEX IF EXISTS idx_customer_addresses_is_default;
DROP INDEX IF EXISTS idx_customer_addresses_user_default;
DROP INDEX IF EXISTS idx_customer_addresses_user_id;

-- ----------------------------------------------------------------------------
-- 4. DROP TABLE
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS customer_addresses CASCADE;

-- ----------------------------------------------------------------------------
-- 5. DROP FUNCTION (Optional - only if not used by other tables)
-- ----------------------------------------------------------------------------

-- WARNING: Only drop this function if no other tables use it
-- Check first: SELECT event_object_table FROM information_schema.triggers 
--              WHERE action_statement LIKE '%update_updated_at_column%';

-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ----------------------------------------------------------------------------
-- END OF ROLLBACK
-- ----------------------------------------------------------------------------
```

### 7.2 Verificación Post-Rollback

```sql
-- Verify table is gone
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'customer_addresses';
-- Expected: 0 rows

-- Verify indexes are gone
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'customer_addresses';
-- Expected: 0 rows

-- Verify policies are gone
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'customer_addresses';
-- Expected: 0 rows

-- Verify trigger is gone
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'customer_addresses';
-- Expected: 0 rows
```

### 7.3 Notas de Rollback

**⚠️ ADVERTENCIAS:**
1. **Pérdida de datos:** Rollback elimina PERMANENTEMENTE todas las direcciones guardadas por clientes
2. **No revertible:** Una vez ejecutado, no se puede recuperar data sin backup
3. **Función shared:** `update_updated_at_column()` se deja intacta (usada por otras tablas)

**Cuándo ejecutar rollback:**
- Migration falla y necesita corrección
- Diseño de tabla requiere cambio fundamental
- Testing en ambiente dev (reset state)

**NO ejecutar rollback si:**
- Tabla ya tiene datos en producción
- Solo necesitas agregar/modificar columnas (usar ALTER TABLE en nueva migración)
- Solo necesitas ajustar RLS policies (usar ALTER POLICY o CREATE/DROP POLICY)

---

## 8. QUERIES DE VALIDACIÓN POST-MIGRACIÓN

### 8.1 Verificación Estructura

```sql
-- 1. Verificar tabla existe
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name = 'customer_addresses';
-- Expected: 1 row, table_type = 'BASE TABLE'

-- 2. Verificar columnas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'customer_addresses'
ORDER BY ordinal_position;
-- Expected: 16 columns (id, user_id, full_name, phone_country_code, phone_country_iso, phone, country, state, city, postal_code, address_line1, address_line2, references, is_default, created_at, updated_at)

-- 3. Verificar NOT NULL constraints
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'customer_addresses'
  AND is_nullable = 'NO';
-- Expected: id, user_id, full_name, country, city, address_line1, is_default, created_at, updated_at

-- 4. Verificar foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'customer_addresses';
-- Expected: 1 row (user_id → auth.users, ON DELETE CASCADE)
```

### 8.2 Verificación Índices

```sql
-- 5. Verificar índices creados
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'customer_addresses'
ORDER BY indexname;
-- Expected: 4 indexes
--   - customer_addresses_pkey (PRIMARY KEY on id)
--   - idx_customer_addresses_user_id
--   - idx_customer_addresses_user_default (UNIQUE partial WHERE is_default = true)
--   - idx_customer_addresses_is_default (partial WHERE is_default = true)

-- 6. Verificar índice único parcial
SELECT
  i.relname AS index_name,
  pg_get_indexdef(i.oid) AS index_definition
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
WHERE t.relname = 'customer_addresses'
  AND i.relname = 'idx_customer_addresses_user_default';
-- Expected: Index definition includes "WHERE (is_default = true)"
```

### 8.3 Verificación RLS

```sql
-- 7. Verificar RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'customer_addresses';
-- Expected: rowsecurity = true

-- 8. Verificar policies creadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'customer_addresses'
ORDER BY policyname;
-- Expected: 4 policies
--   - Customers can delete own addresses (DELETE, USING auth.uid() = user_id)
--   - Customers can insert own addresses (INSERT, WITH CHECK auth.uid() = user_id)
--   - Customers can update own addresses (UPDATE, USING + WITH CHECK auth.uid() = user_id)
--   - Customers can view own addresses (SELECT, USING auth.uid() = user_id)

-- 9. Verificar NO hay policies públicas
SELECT policyname
FROM pg_policies
WHERE tablename = 'customer_addresses'
  AND (qual = 'true' OR with_check = 'true');
-- Expected: 0 rows
```

### 8.4 Verificación Trigger

```sql
-- 10. Verificar trigger updated_at
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'customer_addresses';
-- Expected: 1 row
--   trigger_name = set_customer_addresses_updated_at
--   event_manipulation = UPDATE
--   action_statement includes 'update_updated_at_column()'
```

### 8.5 Verificación Funcional

```sql
-- 11. Test INSERT (via service_role)
INSERT INTO customer_addresses (
  user_id,
  full_name,
  phone_country_code,
  phone_country_iso,
  phone,
  country,
  state,
  city,
  postal_code,
  address_line1,
  is_default
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Replace with real user_id
  'Test User',
  '+52',
  'MX',
  '5551234567',
  'México',
  'CDMX',
  'Ciudad de México',
  '06600',
  'Calle Test 123',
  true
) RETURNING *;
-- Expected: 1 row inserted, id generated, created_at/updated_at auto-populated

-- 12. Test SELECT
SELECT * FROM customer_addresses;
-- Expected: At least 1 row (the test insert)

-- 13. Test UPDATE (updated_at trigger)
UPDATE customer_addresses
SET full_name = 'Updated Test User'
WHERE full_name = 'Test User'
RETURNING id, full_name, created_at, updated_at;
-- Expected: updated_at > created_at

-- 14. Test unique default constraint
-- Try inserting second default for same user (should fail)
INSERT INTO customer_addresses (
  user_id,
  full_name,
  country,
  city,
  address_line1,
  is_default
) VALUES (
  (SELECT user_id FROM customer_addresses LIMIT 1),
  'Second Default Address',
  'México',
  'Guadalajara',
  'Calle Test 456',
  true
);
-- Expected: ERROR 23505 (duplicate key value violates unique constraint "idx_customer_addresses_user_default")

-- 15. Cleanup test data
DELETE FROM customer_addresses WHERE full_name LIKE '%Test%';
```

### 8.6 Script Automatizado de Validación

```bash
# Save as: scripts/validate-migration-024.mjs
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validateMigration024() {
  console.log('🔍 Validating Migration 024: customer_addresses\n');

  // 1. Table exists
  const { data: tableExists } = await supabase.rpc('check_table_exists', { 
    table_name: 'customer_addresses' 
  });
  console.log(tableExists ? '✅ Table exists' : '❌ Table missing');

  // 2. Columns count
  const { count: columnCount } = await supabase
    .from('information_schema.columns')
    .select('*', { count: 'exact', head: true })
    .eq('table_name', 'customer_addresses');
  console.log(columnCount === 16 ? '✅ 16 columns' : `❌ ${columnCount} columns (expected 16)`);

  // 3. Indexes count
  const { count: indexCount } = await supabase.rpc('count_indexes', {
    table_name: 'customer_addresses'
  });
  console.log(indexCount === 4 ? '✅ 4 indexes' : `❌ ${indexCount} indexes (expected 4)`);

  // 4. RLS enabled
  const { data: rlsEnabled } = await supabase.rpc('check_rls_enabled', {
    table_name: 'customer_addresses'
  });
  console.log(rlsEnabled ? '✅ RLS enabled' : '❌ RLS disabled');

  // 5. Policies count
  const { count: policyCount } = await supabase.rpc('count_policies', {
    table_name: 'customer_addresses'
  });
  console.log(policyCount === 4 ? '✅ 4 policies' : `❌ ${policyCount} policies (expected 4)`);

  console.log('\n✅ Migration 024 validation complete');
}

validateMigration024();
```

---

## 9. CONFIRMACIÓN FINAL

### ✅ CONFIRMACIONES OBLIGATORIAS

1. **SQL Completo:** ✅ Entregado en sección 3
2. **Explicación Policies:** ✅ Entregado en sección 4
3. **Garantía una default:** ✅ Índice único parcial explicado en sección 5
4. **phone_country_code/iso:** ✅ SÍ agregados (explicación en sección 1)
5. **Riesgos:** ✅ 6 riesgos identificados con mitigaciones en sección 6
6. **Rollback:** ✅ SQL completo en sección 7
7. **Queries validación:** ✅ 15 queries + script automatizado en sección 8

### ✅ NO TOQUÉ CÓDIGO NI DB

- ❌ No ejecuté SQL en Supabase
- ❌ No modifiqué archivos de código
- ❌ No toqué UI
- ❌ No toqué checkout
- ❌ No toqué Stripe
- ❌ No toqué webhook
- ❌ No toqué admin
- ❌ No toqué orders
- ❌ No toqué layaways

**Estado:** SQL preparado, esperando tu aprobación para ejecución.

---

## 10. SIGUIENTE PASO

Una vez apruebes este SQL:

**Opción A (Ejecución Manual en Supabase Dashboard):**
1. Copiar SQL de sección 3
2. Pegar en Supabase Dashboard → SQL Editor → New Query
3. Ejecutar
4. Ejecutar queries de validación (sección 8.1 - 8.5)
5. Confirmar: tabla creada, RLS activa, 4 policies, 4 índices

**Opción B (Ejecución por Script):**
1. Crear archivo `supabase/migrations/024_customer_addresses.sql`
2. Copiar SQL de sección 3
3. Ejecutar: `supabase db push` (si usas Supabase CLI)
4. O ejecutar via script Node: `scripts/execute-migration-024.mjs`

**Opción C (Te pido ejecutarlo):**
1. Apruebas SQL
2. Te digo "ejecuta Opción A o B"
3. Yo ejecuto y reporto resultado

**¿Qué prefieres?**

---

**ESTADO:** ⏸️ SQL completo preparado, esperando aprobación de Jhonatan  
**SIGUIENTE ACCIÓN:** Revisar SQL → Aprobar → Ejecutar → Validar

---

**Preparado por:** Kepler  
**Fecha:** 2026-05-03  
**Proyecto:** Bagclue E-commerce — KeplerAgents
