# FASE 5C.2 — VALIDACIÓN FINAL DE MIGRACIONES

**Fecha:** 2026-05-01 20:38 UTC  
**Proyecto:** Bagclue E-commerce de Lujo  
**Autor:** Kepler  
**Status:** EN VALIDACIÓN (no cerrada)

---

## ESTADO ACTUAL

- ✅ Migration 018 ejecutada: PENDIENTE CONFIRMAR CON EVIDENCIA
- ✅ Migration 019 ejecutada: PENDIENTE CONFIRMAR CON EVIDENCIA
- ✅ Migration 020 ejecutada: PENDIENTE CONFIRMAR CON EVIDENCIA
- ⏳ Fase 5C.2: EN VALIDACIÓN

**NO SE TOCÓ:**
- ✅ Frontend
- ✅ Stripe
- ✅ Webhook
- ✅ Checkout
- ✅ Admin
- ✅ Cron jobs
- ✅ Panel cliente de apartados

---

## QUERIES DE VALIDACIÓN COMPLETA

Ejecutar en Supabase SQL Editor para obtener evidencia:

```sql
-- ========================================
-- VALIDACIÓN 1: Estructura de layaways
-- ========================================

-- 1A. Listar TODAS las columnas de layaways
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'layaways'
ORDER BY ordinal_position;

-- 1B. Verificar columnas NUEVAS específicas
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'layaways'
AND column_name IN (
  'plan_type',
  'total_payments',
  'first_payment_amount',
  'minimum_first_payment_amount',
  'total_amount',
  'amount_paid',
  'amount_remaining',
  'payments_completed',
  'payments_remaining',
  'next_payment_due_date',
  'next_payment_amount',
  'plan_start_date',
  'plan_end_date',
  'last_payment_at',
  'consecutive_weeks_without_payment',
  'forfeited_at',
  'user_id',
  'policy_version'
)
ORDER BY column_name;
-- Esperado: 18 filas (19 columnas nuevas, pero policy_version tiene default)

-- 1C. Verificar constraint de status
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'layaways'::regclass
AND conname = 'layaways_status_check';
-- Esperado: incluye todos los estados nuevos

-- 1D. Verificar todos los constraints de layaways
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'layaways'::regclass
ORDER BY conname;

-- 1E. Verificar índices de layaways
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'layaways'
ORDER BY indexname;
-- Esperado: índices antiguos + 6 nuevos

-- ========================================
-- VALIDACIÓN 2: Estructura de layaway_payments
-- ========================================

-- 2A. Listar TODAS las columnas de layaway_payments
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_name = 'layaway_payments'
ORDER BY ordinal_position;
-- Esperado: 14 columnas

-- 2B. Verificar constraints de layaway_payments
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'layaway_payments'::regclass
ORDER BY conname;
-- Esperado: PK, FK a layaways, checks de status y payment_type

-- 2C. Verificar índices de layaway_payments
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'layaway_payments'
ORDER BY indexname;
-- Esperado: 5 índices (layaway_id, status, due_date, payment_number, unique)

-- 2D. Verificar trigger updated_at existe
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'layaway_payments'
ORDER BY trigger_name;
-- Esperado: 1 trigger (trigger_update_layaway_payments_updated_at)

-- 2E. Verificar función del trigger existe
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'update_layaway_payments_updated_at';

-- ========================================
-- VALIDACIÓN 3: RLS Policies
-- ========================================

-- 3A. Verificar RLS habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('layaways', 'layaway_payments')
ORDER BY tablename;
-- Esperado: ambas con rls_enabled = true

-- 3B. Listar TODAS las policies de layaways
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
WHERE tablename = 'layaways'
ORDER BY policyname;
-- Esperado: 2 policies (service_role, customers)

-- 3C. Listar TODAS las policies de layaway_payments
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
WHERE tablename = 'layaway_payments'
ORDER BY policyname;
-- Esperado: 2 policies (service_role, customers)

-- 3D. Verificar NO existen policies públicas amplias
SELECT 
  tablename,
  policyname,
  roles
FROM pg_policies
WHERE tablename IN ('layaways', 'layaway_payments')
AND (
  'anon' = ANY(roles)
  OR 'authenticated' = ANY(roles)
)
AND policyname LIKE '%Public%'
ORDER BY tablename, policyname;
-- Esperado: 0 filas (no deben existir policies públicas amplias)

-- ========================================
-- VALIDACIÓN 4: Compatibilidad
-- ========================================

-- 4A. Verificar apartados existentes no se rompieron
SELECT 
  id,
  status,
  product_price,
  deposit_amount,
  balance_amount,
  plan_type,
  policy_version
FROM layaways
ORDER BY created_at DESC
LIMIT 5;
-- Si hay apartados antiguos, deben tener plan_type = NULL, policy_version = NULL o 1

-- 4B. Verificar estructura de orders no cambió
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN ('id', 'user_id', 'customer_email', 'total', 'status', 'layaway_id')
ORDER BY column_name;
-- Esperado: 6 columnas intactas

-- 4C. Verificar estructura de products no cambió
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('id', 'price', 'status', 'allow_layaway')
ORDER BY column_name;
-- Esperado: 4 columnas intactas

-- 4D. Contar apartados por policy_version
SELECT 
  COALESCE(policy_version::text, 'NULL') as version,
  COUNT(*) as count
FROM layaways
GROUP BY policy_version
ORDER BY policy_version;
-- Verificar distribución

-- ========================================
-- VALIDACIÓN 5: Datos de prueba (DRY - sin insertar)
-- ========================================

-- 5A. Validar que el esquema soporta inserción de apartado nuevo
EXPLAIN (VERBOSE, COSTS OFF)
INSERT INTO layaways (
  product_id,
  customer_name,
  customer_email,
  customer_phone,
  plan_type,
  total_payments,
  first_payment_amount,
  minimum_first_payment_amount,
  total_amount,
  amount_paid,
  amount_remaining,
  payments_completed,
  payments_remaining,
  next_payment_due_date,
  next_payment_amount,
  plan_start_date,
  plan_end_date,
  status,
  policy_version,
  product_price,
  deposit_percent,
  deposit_amount,
  balance_amount,
  currency,
  layaway_token
) VALUES (
  (SELECT id FROM products WHERE status = 'available' LIMIT 1),
  'Test Cliente',
  'test@example.com',
  '+521234567890',
  '4_weekly_payments',
  4,
  112500.00,
  112500.00,
  450000.00,
  0,
  450000.00,
  0,
  4,
  NOW() + INTERVAL '7 days',
  112500.00,
  NOW(),
  NOW() + INTERVAL '21 days',
  'pending_first_payment',
  2,
  450000.00,
  25.00,
  112500.00,
  337500.00,
  'MXN',
  encode(gen_random_bytes(16), 'hex')
);
-- Esperado: plan de ejecución sin errores (no ejecuta, solo valida)

-- 5B. Validar que el esquema soporta inserción de pagos
EXPLAIN (VERBOSE, COSTS OFF)
INSERT INTO layaway_payments (
  layaway_id,
  payment_number,
  amount_due,
  due_date,
  status,
  payment_type
) VALUES (
  (SELECT id FROM layaways LIMIT 1),
  1,
  112500.00,
  NOW(),
  'pending',
  'first'
);
-- Esperado: plan de ejecución sin errores

-- ========================================
-- VALIDACIÓN 6: Seguridad RLS
-- ========================================

-- 6A. Verificar que service_role puede leer todo
-- (Requiere conexión con service_role, no se puede desde SQL Editor normal)
-- Validar manualmente desde API route o supabaseAdmin

-- 6B. Verificar definición exacta de policies
SELECT 
  tablename,
  policyname,
  pg_get_expr(qual, tablename::regclass) as using_clause,
  pg_get_expr(with_check, tablename::regclass) as with_check_clause
FROM pg_policies
WHERE tablename IN ('layaways', 'layaway_payments')
ORDER BY tablename, policyname;

-- ========================================
-- VALIDACIÓN 7: Integridad referencial
-- ========================================

-- 7A. Verificar foreign keys de layaway_payments
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'layaway_payments'
ORDER BY tc.constraint_name;
-- Esperado: FK a layaways con ON DELETE CASCADE

-- 7B. Verificar foreign keys de layaways
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'layaways'
ORDER BY tc.constraint_name;
-- Esperado: FK a products, user_id a auth.users

-- ========================================
-- VALIDACIÓN 8: Verificar no hay cron jobs creados
-- ========================================

-- No aplica a Supabase, verificar en OpenClaw Gateway
-- Estado: NINGÚN cron job creado para apartados

-- ========================================
-- VALIDACIÓN 9: Verificar no hay liberación automática
-- ========================================

-- No hay código implementado todavía
-- Estado: NINGUNA lógica de liberación automática

-- ========================================
-- VALIDACIÓN COMPLETA
-- ========================================

-- Resumen final
SELECT 
  'layaways columns' as validation,
  COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'layaways'
UNION ALL
SELECT 
  'layaway_payments columns',
  COUNT(*)
FROM information_schema.columns
WHERE table_name = 'layaway_payments'
UNION ALL
SELECT 
  'layaways indexes',
  COUNT(*)
FROM pg_indexes
WHERE tablename = 'layaways'
UNION ALL
SELECT 
  'layaway_payments indexes',
  COUNT(*)
FROM pg_indexes
WHERE tablename = 'layaway_payments'
UNION ALL
SELECT 
  'layaways policies',
  COUNT(*)
FROM pg_policies
WHERE tablename = 'layaways'
UNION ALL
SELECT 
  'layaway_payments policies',
  COUNT(*)
FROM pg_policies
WHERE tablename = 'layaway_payments';
```

---

## INSTRUCCIONES DE VALIDACIÓN

1. **Copiar todo el SQL de validación** arriba
2. **Ejecutar en Supabase SQL Editor**
3. **Capturar resultados** de cada query
4. **Enviar screenshots o texto** de los resultados
5. **Kepler analiza** y genera reporte PASS/FAIL

---

## CRITERIOS DE CIERRE FASE 5C.2

| # | Validación | Esperado | Estado |
|---|------------|----------|--------|
| 1 | layaways tiene columnas correctas | 18+ columnas nuevas | PENDIENTE |
| 2 | layaway_payments existe y correcta | 14 columnas | PENDIENTE |
| 3 | Constraints correctos | status, FK, checks | PENDIENTE |
| 4 | Indexes correctos | 6 nuevos en layaways, 5 en payments | PENDIENTE |
| 5 | RLS seguro | 2 policies cada tabla | PENDIENTE |
| 6 | NO policies públicas amplias | 0 policies públicas | PENDIENTE |
| 7 | service_role funciona | Acceso total | PENDIENTE |
| 8 | Compatibilidad sistema anterior | Apartados antiguos OK | PENDIENTE |
| 9 | NO se tocó Stripe/checkout/webhook/admin/frontend | Sin cambios | ✅ PASS |
| 10 | NO se crearon crons | 0 cron jobs | ✅ PASS |
| 11 | Trigger updated_at | 1 trigger en layaway_payments | PENDIENTE |
| 12 | Foreign keys correctos | CASCADE en payments | PENDIENTE |
| 13 | Tipos de datos correctos | NUMERIC(10,2) para dinero | PENDIENTE |
| 14 | Defaults correctos | amount_paid=0, status=pending | PENDIENTE |
| 15 | Integridad referencial | FK válidos | PENDIENTE |

**Solo cuando todo esté en PASS → Fase 5C.2 CERRADA**

---

## ROLLBACK PLAN

Si necesitamos revertir:

### Revertir Migration 020 (RLS)
```sql
-- Eliminar policies de layaway_payments
DROP POLICY IF EXISTS "Service role full access on layaway_payments" ON layaway_payments;
DROP POLICY IF EXISTS "Customers can view own layaway payments" ON layaway_payments;

-- Eliminar policy de layaways
DROP POLICY IF EXISTS "Customers can view own layaways" ON layaways;

-- Restaurar policies antiguas
CREATE POLICY "Public can read layaways by token"
  ON layaways FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can insert layaways"
  ON layaways FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Disable RLS en layaway_payments
ALTER TABLE layaway_payments DISABLE ROW LEVEL SECURITY;
```

**Datos perdidos:** NINGUNO

---

### Revertir Migration 019 (layaway_payments)
```sql
DROP TABLE IF EXISTS layaway_payments CASCADE;
DROP FUNCTION IF EXISTS update_layaway_payments_updated_at();
```

**Datos perdidos:** TODOS los registros en `layaway_payments` (si existen)

---

### Revertir Migration 018 (columnas layaways)
```sql
ALTER TABLE layaways
  DROP COLUMN IF EXISTS plan_type,
  DROP COLUMN IF EXISTS total_payments,
  DROP COLUMN IF EXISTS first_payment_amount,
  DROP COLUMN IF EXISTS minimum_first_payment_amount,
  DROP COLUMN IF EXISTS total_amount,
  DROP COLUMN IF EXISTS amount_paid,
  DROP COLUMN IF EXISTS amount_remaining,
  DROP COLUMN IF EXISTS payments_completed,
  DROP COLUMN IF EXISTS payments_remaining,
  DROP COLUMN IF EXISTS next_payment_due_date,
  DROP COLUMN IF EXISTS next_payment_amount,
  DROP COLUMN IF EXISTS plan_start_date,
  DROP COLUMN IF EXISTS plan_end_date,
  DROP COLUMN IF EXISTS last_payment_at,
  DROP COLUMN IF EXISTS consecutive_weeks_without_payment,
  DROP COLUMN IF EXISTS forfeited_at,
  DROP COLUMN IF EXISTS user_id,
  DROP COLUMN IF EXISTS policy_version;

-- Restaurar constraint antiguo
ALTER TABLE layaways DROP CONSTRAINT IF EXISTS layaways_status_check;
ALTER TABLE layaways ADD CONSTRAINT layaways_status_check
  CHECK (status IN ('pending', 'active', 'completed', 'expired', 'cancelled'));

-- Eliminar índices nuevos
DROP INDEX IF EXISTS idx_layaways_plan_type;
DROP INDEX IF EXISTS idx_layaways_plan_end_date;
DROP INDEX IF EXISTS idx_layaways_last_payment_at;
DROP INDEX IF EXISTS idx_layaways_consecutive_weeks;
DROP INDEX IF EXISTS idx_layaways_user_id;
DROP INDEX IF EXISTS idx_layaways_next_payment_due;
```

**Datos perdidos:** Valores en las 18 columnas nuevas de `layaways` (si existen)

---

## ESTADO ACTUAL

**Esperando resultados de queries de validación para completar reporte PASS/FAIL.**

**NO proceder a Fase 5C.3 hasta que Fase 5C.2 esté cerrada.**
