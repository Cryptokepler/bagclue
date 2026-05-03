# FASE 5E.1 — SQL MIGRACIÓN CUSTOMER_PROFILES PHONE INTERNACIONAL

**Fecha:** 2026-05-03  
**Proyecto:** Bagclue  
**Fase:** 5E.1 (Migration - customer_profiles phone international)  
**Estado:** PREPARADO (pendiente ejecución manual)

---

## OBJETIVO

Agregar campos internacionales de teléfono a `customer_profiles` para consistencia con `customer_addresses`.

**Columnas a agregar:**
- `phone_country_code` TEXT DEFAULT '+52'
- `phone_country_iso` TEXT DEFAULT 'MX'

**NO se modifica:**
- Columna `phone` existente (se mantiene)
- RLS policies
- Triggers
- Otras columnas
- Datos existentes

---

## 1. SQL VERIFICACIÓN ESTRUCTURA ACTUAL

**Ejecutar ANTES de la migración para confirmar estado actual:**

```sql
-- ========================================
-- VERIFICACIÓN PRE-MIGRACIÓN
-- ========================================

-- 1.1 Verificar que tabla customer_profiles existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'customer_profiles'
) AS table_exists;
-- Esperado: true


-- 1.2 Listar columnas actuales de customer_profiles
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'customer_profiles'
ORDER BY ordinal_position;
-- Esperado: id, user_id, email, name, phone, created_at, updated_at


-- 1.3 Verificar que phone_country_code NO existe todavía
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'customer_profiles'
    AND column_name = 'phone_country_code'
) AS phone_country_code_exists;
-- Esperado: false


-- 1.4 Verificar que phone_country_iso NO existe todavía
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'customer_profiles'
    AND column_name = 'phone_country_iso'
) AS phone_country_iso_exists;
-- Esperado: false


-- 1.5 Contar registros actuales (para verificar después que no se perdieron)
SELECT COUNT(*) AS total_profiles FROM customer_profiles;
-- Guardar este número para comparar después


-- 1.6 Verificar RLS habilitado
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'customer_profiles';
-- Esperado: relrowsecurity = true


-- 1.7 Listar policies actuales
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'customer_profiles'
ORDER BY policyname;
-- Esperado: 2 policies (Users can view own profile, Users can update own profile)


-- 1.8 Verificar triggers actuales
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'customer_profiles'
ORDER BY trigger_name;
-- Esperado: update_customer_profiles_updated_at (BEFORE UPDATE)
```

---

## 2. SQL MIGRACIÓN

**Ejecutar SOLO si verificación pre-migración es correcta:**

```sql
-- ========================================
-- MIGRATION 026: Customer Profiles - Phone International
-- ========================================
-- Purpose: Add phone_country_code and phone_country_iso to customer_profiles
-- Consistency with customer_addresses table
-- Date: 2026-05-03
-- Author: Kepler (approved by Jhonatan)
-- ========================================

-- Start transaction for safety
BEGIN;

-- 2.1 Add phone_country_code column
ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS phone_country_code TEXT DEFAULT '+52';

-- 2.2 Add phone_country_iso column
ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS phone_country_iso TEXT DEFAULT 'MX';

-- 2.3 Add comment for documentation
COMMENT ON COLUMN customer_profiles.phone_country_code IS 'International phone country code (e.g. +52, +34, +1)';
COMMENT ON COLUMN customer_profiles.phone_country_iso IS 'ISO 3166-1 alpha-2 country code (e.g. MX, ES, US)';

-- Commit transaction
COMMIT;

-- ========================================
-- Migration completed successfully
-- ========================================
```

**IMPORTANTE:**
- El `BEGIN` inicia una transacción
- Si algo falla, hacer `ROLLBACK;` para deshacer cambios
- Si todo sale bien, el `COMMIT` confirma los cambios
- Los `DEFAULT` solo aplican a nuevos registros
- Registros existentes tendrán `phone_country_code` y `phone_country_iso` como NULL (no se fuerza default en existentes)

---

## 3. SQL VALIDACIÓN POST-MIGRACIÓN

**Ejecutar DESPUÉS de la migración para confirmar éxito:**

```sql
-- ========================================
-- VALIDACIÓN POST-MIGRACIÓN
-- ========================================

-- 3.1 Verificar que phone_country_code existe ahora
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'customer_profiles'
    AND column_name = 'phone_country_code'
) AS phone_country_code_exists;
-- Esperado: true ✅


-- 3.2 Verificar que phone_country_iso existe ahora
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'customer_profiles'
    AND column_name = 'phone_country_iso'
) AS phone_country_iso_exists;
-- Esperado: true ✅


-- 3.3 Verificar tipo de datos correcto
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'customer_profiles'
  AND column_name IN ('phone_country_code', 'phone_country_iso')
ORDER BY column_name;
-- Esperado:
-- phone_country_code | text | YES | '+52'::text
-- phone_country_iso  | text | YES | 'MX'::text


-- 3.4 Verificar que columna phone original sigue existiendo
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'customer_profiles'
    AND column_name = 'phone'
) AS phone_exists;
-- Esperado: true ✅


-- 3.5 Verificar todas las columnas finales
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'customer_profiles'
ORDER BY ordinal_position;
-- Esperado: id, user_id, email, name, phone, created_at, updated_at, phone_country_code, phone_country_iso


-- 3.6 Contar registros después de migración
SELECT COUNT(*) AS total_profiles_after FROM customer_profiles;
-- Esperado: MISMO número que pre-migración ✅


-- 3.7 Verificar RLS sigue habilitado
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'customer_profiles';
-- Esperado: relrowsecurity = true ✅


-- 3.8 Verificar policies siguen igual
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'customer_profiles'
ORDER BY policyname;
-- Esperado: 2 policies (sin cambios) ✅


-- 3.9 Verificar triggers siguen igual
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'customer_profiles'
ORDER BY trigger_name;
-- Esperado: update_customer_profiles_updated_at (BEFORE UPDATE) ✅


-- 3.10 Verificar que otros campos NO fueron modificados
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'customer_profiles'
  AND column_name IN ('id', 'user_id', 'email', 'name', 'phone', 'created_at', 'updated_at')
ORDER BY ordinal_position;
-- Esperado: todos con tipos originales (uuid, text, timestamptz) ✅


-- 3.11 Muestra de datos (verificar que registros existentes están intactos)
SELECT 
  id,
  email,
  name,
  phone,
  phone_country_code,
  phone_country_iso,
  created_at
FROM customer_profiles
LIMIT 5;
-- Esperado: 
-- - Registros existentes tienen phone_country_code = NULL (o '+52' si se crearon después)
-- - Registros existentes tienen phone_country_iso = NULL (o 'MX' si se crearon después)
-- - email, name, phone siguen igual ✅


-- 3.12 Verificar que NO se tocaron otras tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'products', 
    'orders', 
    'layaways', 
    'customer_addresses',
    'order_items',
    'layaway_payments'
  )
ORDER BY table_name;
-- Esperado: todas las tablas siguen existiendo, sin modificaciones ✅
```

---

## 4. SQL ROLLBACK (SI ALGO FALLA)

**SOLO ejecutar si la migración falló y necesitas deshacer cambios:**

```sql
-- ========================================
-- ROLLBACK MIGRATION 026
-- ========================================
-- Use ONLY if migration failed and you need to undo changes
-- ========================================

BEGIN;

-- Remove phone_country_code column
ALTER TABLE customer_profiles
  DROP COLUMN IF EXISTS phone_country_code;

-- Remove phone_country_iso column
ALTER TABLE customer_profiles
  DROP COLUMN IF EXISTS phone_country_iso;

COMMIT;

-- ========================================
-- Rollback completed
-- ========================================
```

**Después de rollback, ejecutar validaciones:**

```sql
-- Verificar que columnas fueron eliminadas
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'customer_profiles'
  AND column_name IN ('phone_country_code', 'phone_country_iso');
-- Esperado: 0 rows (columnas eliminadas)

-- Verificar que tabla sigue existiendo
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'customer_profiles'
) AS table_exists;
-- Esperado: true

-- Verificar count de registros
SELECT COUNT(*) FROM customer_profiles;
-- Esperado: mismo número que antes
```

---

## 5. RESUMEN DE VALIDACIONES

### Checklist Pre-Migración

- [ ] 1. Tabla customer_profiles existe
- [ ] 2. Columnas actuales: id, user_id, email, name, phone, created_at, updated_at
- [ ] 3. phone_country_code NO existe
- [ ] 4. phone_country_iso NO existe
- [ ] 5. Total registros guardado: _____ (anotar número)
- [ ] 6. RLS habilitado: true
- [ ] 7. Policies: 2 (view, update)
- [ ] 8. Trigger: update_customer_profiles_updated_at

### Checklist Post-Migración

- [ ] 1. phone_country_code existe ✅
- [ ] 2. phone_country_iso existe ✅
- [ ] 3. Tipo: TEXT para ambas
- [ ] 4. Default: '+52' y 'MX'
- [ ] 5. Columna phone original sigue existiendo ✅
- [ ] 6. Total columnas: 9 (7 originales + 2 nuevas)
- [ ] 7. Total registros: _____ (mismo que pre-migración) ✅
- [ ] 8. RLS sigue habilitado ✅
- [ ] 9. Policies siguen igual (2) ✅
- [ ] 10. Trigger sigue igual ✅
- [ ] 11. Otras columnas NO modificadas ✅
- [ ] 12. Otras tablas NO tocadas ✅

---

## 6. IMPACTO Y SEGURIDAD

### ✅ Cambios seguros

1. **Columnas nuevas son nullable:** No rompe código existente
2. **DEFAULT solo aplica a nuevos registros:** Existentes no se fuerzan
3. **RLS no cambia:** Policies siguen protegiendo datos
4. **Triggers no cambian:** updated_at sigue funcionando
5. **Otras columnas intactas:** email, name, phone no se modifican

### ⚠️ Consideraciones

1. **Registros existentes tendrán NULL en nuevas columnas:**
   - phone_country_code = NULL (no '+52' automático)
   - phone_country_iso = NULL (no 'MX' automático)
   - Esto es esperado y seguro

2. **Nuevos registros (después de migración):**
   - Si INSERT sin especificar phone_country_code → usa '+52'
   - Si INSERT sin especificar phone_country_iso → usa 'MX'

3. **Endpoint GET /api/customer/profile:**
   - Seguirá funcionando (retornará NULL en nuevas columnas para users existentes)
   - NO rompe código frontend (nuevas columnas son opcionales)

4. **Migración futura de datos existentes (opcional):**
   - Si quisiéramos llenar phone_country_code/iso de users existentes
   - Sería otro script UPDATE separado
   - NO forma parte de esta migración

---

## 7. ARCHIVO SQL FINAL

**Guardar como:** `supabase/migrations/026_customer_profiles_phone_international.sql`

```sql
-- ========================================
-- Migration 026: Customer Profiles - Phone International
-- ========================================
-- Purpose: Add phone_country_code and phone_country_iso
-- Consistency with customer_addresses table
-- Date: 2026-05-03
-- Author: Kepler
-- Approved: Jhonatan
-- ========================================

-- Add phone country code field (international format)
ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS phone_country_code TEXT DEFAULT '+52';

-- Add phone country ISO code (2-letter country code)
ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS phone_country_iso TEXT DEFAULT 'MX';

-- Add documentation
COMMENT ON COLUMN customer_profiles.phone_country_code IS 'International phone country code (e.g. +52, +34, +1)';
COMMENT ON COLUMN customer_profiles.phone_country_iso IS 'ISO 3166-1 alpha-2 country code (e.g. MX, ES, US)';

-- ========================================
-- Migration completed
-- ========================================
```

---

## 8. PRÓXIMOS PASOS (DESPUÉS DE EJECUTAR SQL)

**NO implementar todavía, solo listar:**

1. ⏸️ Crear endpoint PATCH /api/customer/profile
2. ⏸️ Crear página /account/profile
3. ⏸️ Crear ProfileForm component
4. ⏸️ Crear SupportSection component
5. ⏸️ Actualizar navegación AccountLayout

**Esperando aprobación para continuar Fase 5E.2 (Backend + Frontend).**

---

## ESTADO

**Fase 5E.1:** SQL PREPARADO ✅  
**Pendiente:** Ejecución manual por Jhonatan en Supabase Dashboard  
**Después de ejecutar:** Reportar PASS/FAIL de validaciones (12 checks post-migración)

**NO se toca:**
- Código backend
- Código frontend
- Checkout
- Stripe
- Webhook
- Admin
- Orders/Layaways/Products
- Customer_addresses

---

**Preparado por:** Kepler  
**Fecha:** 2026-05-03  
**Fase:** 5E.1 (SQL Migration only)
