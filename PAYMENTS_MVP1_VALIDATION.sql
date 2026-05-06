-- ============================================================================
-- PAYMENTS MVP.1 — DB SCHEMA VALIDATION (V3 - FINAL)
-- ============================================================================
-- Fecha: 2026-05-06
-- Versión: V3 (ajustes de seguridad)
-- Autor: Kepler
-- Objetivo: Validar que PAYMENTS_MVP1_MIGRATION.sql V3 se ejecutó correctamente
-- Uso: Ejecutar DESPUÉS de migration, revisar resultados manualmente
-- Criterio de éxito: Todas las queries deben retornar resultados esperados
-- Cambios V3: 3 políticas RLS (no 4), 0 storage policies (no 2)
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: VALIDAR TABLA payment_transactions
-- ============================================================================

-- TEST 1.1: Tabla existe
-- Esperado: 1 row con nombre "payment_transactions"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'payment_transactions';

-- TEST 1.2: Columnas existen (debe retornar 29 columnas)
-- Esperado: 29 rows
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'payment_transactions'
ORDER BY ordinal_position;

-- TEST 1.3: Constraints existen
-- Esperado: 2 constraints (PK + payment_transaction_has_relation)
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
  AND table_name = 'payment_transactions';

-- TEST 1.4: Foreign keys existen con DELETE action correcto
-- Esperado: 5 FKs
-- V3: order_id/layaway_id/layaway_payment_id deben tener ON DELETE RESTRICT (o NO ACTION)
-- V3: confirmed_by/rejected_by deben tener ON DELETE SET NULL
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'payment_transactions'
ORDER BY kcu.column_name;

-- Verificación manual:
-- order_id → delete_rule debe ser 'RESTRICT' o 'NO ACTION'
-- layaway_id → delete_rule debe ser 'RESTRICT' o 'NO ACTION'
-- layaway_payment_id → delete_rule debe ser 'RESTRICT' o 'NO ACTION'
-- confirmed_by → delete_rule debe ser 'SET NULL'
-- rejected_by → delete_rule debe ser 'SET NULL'

-- TEST 1.5: Check constraints existen
-- Esperado: 5 checks (payment_type, payment_method, currency, status, payment_transaction_has_relation)
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'payment_transactions'::regclass
  AND contype = 'c'
ORDER BY conname;

-- TEST 1.6: Índices existen
-- Esperado: 8 índices (7 nuevos + 1 PK)
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'payment_transactions'
ORDER BY indexname;

-- TEST 1.7: Trigger updated_at existe
-- Esperado: 1 trigger "update_payment_transactions_updated_at"
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'payment_transactions';

-- TEST 1.8: RLS está habilitado
-- Esperado: 1 row con relrowsecurity = true
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'payment_transactions';

-- TEST 1.9: Políticas RLS existen
-- V3: Esperado 3 policies (no 4)
-- 1. Users can view own transactions
-- 2. Admins can view all transactions
-- 3. Admins can confirm/reject transactions
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'payment_transactions'
ORDER BY policyname;

-- TEST 1.10: Tabla está vacía (no debe haber data)
-- Esperado: 0 rows
SELECT COUNT(*) AS total_transactions FROM payment_transactions;

-- TEST 1.11: Función update_updated_at_column existe
-- V3: Debe existir (fue creada en PASO 0)
-- Esperado: 1 row
SELECT proname, prorettype::regtype
FROM pg_proc
WHERE proname = 'update_updated_at_column';

-- ============================================================================
-- SECCIÓN 2: VALIDAR COLUMNAS NUEVAS EN orders
-- ============================================================================

-- TEST 2.1: Columnas nuevas existen en orders
-- Esperado: 7 rows (payment_method, payment_currency, payment_reference, exchange_rate, amount_mxn, amount_usd, payment_expires_at)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'orders'
  AND column_name IN (
    'payment_method', 
    'payment_currency', 
    'payment_reference', 
    'exchange_rate', 
    'amount_mxn', 
    'amount_usd', 
    'payment_expires_at'
  )
ORDER BY column_name;

-- TEST 2.2: Órdenes existentes NO tienen valores en columnas nuevas
-- Esperado: payment_method = NULL para todas las órdenes existentes
SELECT 
  COUNT(*) AS total_orders,
  COUNT(payment_method) AS orders_with_payment_method,
  COUNT(payment_currency) AS orders_with_payment_currency
FROM orders;
-- Resultado esperado: total_orders > 0, orders_with_payment_method = 0, orders_with_payment_currency = 0

-- ============================================================================
-- SECCIÓN 3: VALIDAR COLUMNAS NUEVAS EN layaways
-- ============================================================================

-- TEST 3.1: Columnas nuevas existen en layaways
-- Esperado: 3 rows (payment_method, payment_currency, exchange_rate)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'layaways'
  AND column_name IN (
    'payment_method', 
    'payment_currency', 
    'exchange_rate'
  )
ORDER BY column_name;

-- TEST 3.2: Apartados existentes NO tienen valores en columnas nuevas
-- Esperado: payment_method = NULL para todos los apartados existentes
SELECT 
  COUNT(*) AS total_layaways,
  COUNT(payment_method) AS layaways_with_payment_method,
  COUNT(payment_currency) AS layaways_with_payment_currency
FROM layaways;
-- Resultado esperado: layaways_with_payment_method = 0, layaways_with_payment_currency = 0

-- ============================================================================
-- SECCIÓN 4: VALIDAR COLUMNAS NUEVAS EN layaway_payments
-- ============================================================================

-- TEST 4.1: Columnas nuevas existen en layaway_payments
-- Esperado: 2 rows (payment_method, payment_reference)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'layaway_payments'
  AND column_name IN (
    'payment_method', 
    'payment_reference'
  )
ORDER BY column_name;

-- TEST 4.2: Pagos de apartado existentes NO tienen valores en columnas nuevas
-- Esperado: payment_method = NULL para todos los pagos existentes
SELECT 
  COUNT(*) AS total_layaway_payments,
  COUNT(payment_method) AS payments_with_payment_method,
  COUNT(payment_reference) AS payments_with_payment_reference
FROM layaway_payments;
-- Resultado esperado: payments_with_payment_method = 0, payments_with_payment_reference = 0

-- ============================================================================
-- SECCIÓN 5: VALIDAR STORAGE BUCKET bank-payment-proofs
-- ============================================================================

-- TEST 5.1: Bucket existe
-- Esperado: 1 row con id = 'bank-payment-proofs', public = false
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'bank-payment-proofs';

-- TEST 5.2: Políticas RLS en storage.objects
-- V3: Esperado 0 policies (bucket privado sin RLS público)
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname IN ('Users can upload own proofs', 'Users can view own proofs');
-- Resultado esperado: 0 rows (políticas no creadas en V3)

-- TEST 5.3: Bucket está vacío
-- Esperado: 0 rows
SELECT COUNT(*) AS total_files
FROM storage.objects
WHERE bucket_id = 'bank-payment-proofs';

-- ============================================================================
-- SECCIÓN 6: VALIDAR INTEGRIDAD REFERENCIAL
-- ============================================================================

-- TEST 6.1: Foreign keys en payment_transactions apuntan a tablas correctas
-- Esperado: 5 constraints con tablas destino correctas
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'payment_transactions'
ORDER BY kcu.column_name;

-- TEST 6.2: Constraint payment_transaction_has_relation funciona
-- V3: Este test es crítico — valida que ON DELETE RESTRICT + CHECK coexisten sin conflicto
-- Intentar crear transacción sin relación (debe FALLAR)
-- NO ejecutar, solo para referencia:
/*
INSERT INTO payment_transactions (
  payment_type,
  payment_method,
  currency,
  amount
) VALUES (
  'full_purchase',
  'bank_transfer_mxn',
  'MXN',
  1000.00
);
*/
-- Esperado: ERROR "new row violates check constraint payment_transaction_has_relation"

-- ============================================================================
-- SECCIÓN 7: VALIDAR PERFORMANCE (Opcional)
-- ============================================================================

-- TEST 7.1: Explain plan de query típica de orders (debe seguir siendo rápida)
-- Esperado: Tiempo de ejecución <100ms, sin full table scan
EXPLAIN ANALYZE
SELECT id, product_id, user_id, total, payment_status, shipping_status
FROM orders
WHERE user_id = (SELECT id FROM auth.users LIMIT 1)
ORDER BY created_at DESC
LIMIT 10;

-- TEST 7.2: Explain plan de query con JOIN a payment_transactions
-- Esperado: Uso de índice idx_payment_transactions_order_id
EXPLAIN ANALYZE
SELECT 
  o.id,
  o.total,
  pt.payment_method,
  pt.status AS payment_transaction_status
FROM orders o
LEFT JOIN payment_transactions pt ON pt.order_id = o.id
WHERE o.id = (SELECT id FROM orders LIMIT 1);

-- ============================================================================
-- SECCIÓN 8: RESUMEN DE VALIDACIÓN V3
-- ============================================================================

-- Este query NO es ejecutable — es un resumen manual de lo que debe verificarse

/*
RESUMEN DE VALIDACIÓN V3:
==========================

✅ PASS si:
----------
1. Tabla payment_transactions existe con 29 columnas
2. 8 índices creados (7 + PK)
3. **3 políticas RLS activas en payment_transactions** (no 4)
4. **0 políticas RLS en storage.objects** (no 2)
5. Trigger updated_at existe
6. Función update_updated_at_column existe
7. Columnas nuevas en orders (7), layaways (3), layaway_payments (2)
8. Órdenes/apartados/pagos existentes tienen columnas nuevas = NULL
9. Bucket bank-payment-proofs existe (public = false)
10. **FK con ON DELETE RESTRICT en order_id/layaway_id/layaway_payment_id**
11. **FK con ON DELETE SET NULL en confirmed_by/rejected_by**
12. Constraint payment_transaction_has_relation funciona (rechaza inserts sin relación)
13. Queries de orders siguen siendo rápidas (<200ms)
14. No hay errores en logs de Supabase

❌ FAIL si:
-----------
1. Alguna tabla/columna/índice/policy NO existe
2. Políticas RLS son 4 (debe ser 3 en V3)
3. Existen políticas storage (debe ser 0 en V3)
4. FK tienen ON DELETE SET NULL en order_id/layaway_id (debe ser RESTRICT)
5. Checkout Stripe falla después de migration
6. Queries de orders son >200ms (degradación de performance)
7. Aparecen errores en logs relacionados con columnas payment_*
8. RLS mal configurado (usuarios ven transacciones ajenas)

CAMBIOS V3 vs V2:
------------------
- FK order_id/layaway_id/layaway_payment_id: ON DELETE RESTRICT (era SET NULL)
- RLS policies payment_transactions: 3 (era 4)
- Storage policies: 0 (era 2)
- Función update_updated_at_column: creada explícitamente (era comentada)

ACCIONES SI FAIL:
-----------------
1. Ejecutar PAYMENTS_MVP1_ROLLBACK.sql inmediatamente
2. Revisar logs de Supabase para identificar error exacto
3. Investigar causa raíz antes de reintentar
4. QA manual de checkout Stripe después de rollback

ACCIONES SI PASS:
-----------------
1. QA manual: 1 compra Stripe test → verificar checkout funciona
2. Monitoring logs durante 2 horas
3. Commit + deploy + tag: v1.0.0-payments-mvp1-db-schema
4. Documentar resultado en PAYMENTS_MVP1_EXECUTION_REPORT.md
5. Preparar MVP.2 (APIs + UI de transferencias MXN)
*/

-- ============================================================================
-- FIN DE VALIDACIÓN V3
-- ============================================================================
