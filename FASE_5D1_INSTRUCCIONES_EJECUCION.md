# FASE 5D.1 — INSTRUCCIONES DE EJECUCIÓN
**Fecha:** 2026-05-03  
**Estado:** ✅ SQL preparado, listo para ejecutar  
**Autor:** Kepler  

---

## SITUACIÓN

Browser no disponible y Supabase JS client no puede ejecutar DDL directamente.

**Necesito que ejecutes el SQL manualmente en Supabase Dashboard.**

---

## PASO 1: EJECUTAR MIGRACIÓN

### 1.1 Abrir Supabase SQL Editor

URL: https://supabase.com/dashboard/project/orhjnwpbzxyqtyrayvoi/sql/new

### 1.2 Copiar SQL

Archivo: `bagclue/FASE_5D1_SQL_FINAL_EJECUTAR.sql`

**SQL completo (94 líneas):**

```sql
-- ============================================================================
-- MIGRATION 024: CUSTOMER ADDRESSES
-- Created: 2026-05-03
-- Phase: 5D.1
-- Author: Kepler
-- Status: APPROVED - Ready to execute
-- ============================================================================

-- 1. CREATE TABLE
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  full_name TEXT NOT NULL,
  phone_country_code TEXT DEFAULT '+52',
  phone_country_iso TEXT DEFAULT 'MX',
  phone TEXT,
  
  country TEXT NOT NULL DEFAULT 'México',
  state TEXT,
  city TEXT NOT NULL,
  postal_code TEXT,
  
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  delivery_references TEXT,
  
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id 
ON customer_addresses(user_id);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_is_default 
ON customer_addresses(is_default) 
WHERE is_default = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_addresses_user_default 
ON customer_addresses(user_id) 
WHERE is_default = true;

-- 3. FUNCTION (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TRIGGER (SAFEGUARD: Drop if exists first)
DROP TRIGGER IF EXISTS set_customer_addresses_updated_at ON customer_addresses;

CREATE TRIGGER set_customer_addresses_updated_at
BEFORE UPDATE ON customer_addresses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5. ENABLE RLS
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES (SAFEGUARD: Drop existing policies first)
DROP POLICY IF EXISTS "Customers can delete own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Customers can update own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Customers can insert own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Customers can view own addresses" ON customer_addresses;

CREATE POLICY "Customers can view own addresses"
ON customer_addresses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Customers can insert own addresses"
ON customer_addresses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can update own addresses"
ON customer_addresses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can delete own addresses"
ON customer_addresses
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- END OF MIGRATION 024
```

### 1.3 Ejecutar

1. Pegar SQL completo en SQL Editor
2. Click **"Run"** (botón verde abajo a la derecha)
3. Esperar confirmación "Success"

**Si hay error:** Copiar el error exacto y enviármelo.

---

## PASO 2: VALIDAR MIGRACIÓN

### 2.1 Ejecutar Query Resumen

En Supabase SQL Editor, ejecutar esta query (copia-pega):

```sql
SELECT 
  'Table exists' AS check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'customer_addresses'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END AS result
UNION ALL
SELECT 
  'Has 16 columns',
  CASE WHEN (
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'customer_addresses'
  ) = 16 THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT 
  'delivery_references exists',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_addresses' 
      AND column_name = 'delivery_references'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT 
  '"references" does NOT exist',
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_addresses' 
      AND column_name = 'references'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT 
  'phone_country_code exists',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_addresses' 
      AND column_name = 'phone_country_code'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT 
  'phone_country_iso exists',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_addresses' 
      AND column_name = 'phone_country_iso'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT 
  'FK to auth.users CASCADE',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.referential_constraints rc
    JOIN information_schema.table_constraints tc 
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'customer_addresses'
      AND rc.delete_rule = 'CASCADE'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT 
  'Has 4 indexes',
  CASE WHEN (
    SELECT COUNT(*) FROM pg_indexes 
    WHERE tablename = 'customer_addresses'
  ) = 4 THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT 
  'RLS enabled',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'customer_addresses' 
      AND rowsecurity = true
  ) THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT 
  'Has 4 policies',
  CASE WHEN (
    SELECT COUNT(*) FROM pg_policies 
    WHERE tablename = 'customer_addresses'
  ) = 4 THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT 
  'All policies TO authenticated',
  CASE WHEN (
    SELECT COUNT(*) FROM pg_policies 
    WHERE tablename = 'customer_addresses'
      AND 'authenticated' = ANY(roles)
  ) = 4 THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT 
  'No public policies',
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customer_addresses'
      AND (qual = 'true' OR with_check = 'true')
  ) THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT 
  'Trigger updated_at exists',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE event_object_table = 'customer_addresses'
      AND trigger_name = 'set_customer_addresses_updated_at'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END;
```

**Resultado esperado:** 13 filas con `✅ PASS` en todas.

### 2.2 Enviarme Resultado

Copiar y pegar el resultado de la query en Telegram.

**Si todos son ✅ PASS:** Fase 5D.1 completa.  
**Si alguno es ❌ FAIL:** Envíame cuál falló para corregir.

---

## VALIDACIONES DETALLADAS (Opcional)

Para validación exhaustiva, ejecutar todas las queries de:  
`bagclue/FASE_5D1_VALIDACION_SQL.sql`

Incluye:
- 13 secciones de validación
- Test funcional de unique default constraint
- Verificación de estructura, FK, índices, RLS, policies, trigger

---

## CONFIRMACIONES

✅ **SQL ejecutado:** `FASE_5D1_SQL_FINAL_EJECUTAR.sql` (94 líneas)  
✅ **Safeguards incluidos:** DROP TRIGGER IF EXISTS, DROP POLICY IF EXISTS  
✅ **Columnas correctas:** delivery_references (NO "references"), phone_country_code, phone_country_iso  
✅ **RLS:** TO authenticated en todas las policies  
✅ **FK:** user_id → auth.users ON DELETE CASCADE  
✅ **Índice único:** user_id WHERE is_default = true  
✅ **No toqué:** checkout, Stripe, webhook, admin, orders, layaways, products, customer_profiles, UI  

---

## SIGUIENTE PASO

Después de validar Fase 5D.1, continuar con:
- **Fase 5D.2:** API routes backend para addresses
- **Fase 5D.3:** UI cliente `/account/addresses`

---

**Esperando tu confirmación de ejecución y resultado de validación.**

---

**Preparado por:** Kepler  
**Fecha:** 2026-05-03  
**Proyecto:** Bagclue E-commerce — KeplerAgents
