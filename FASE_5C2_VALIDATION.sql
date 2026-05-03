-- FASE 5C.2 — VALIDATION QUERIES
-- Ejecutar en Supabase SQL Editor (staging DB)
-- Copiar resultado de cada query y enviarlo a Kepler

-- ============================================================
-- 1. ESTRUCTURA DE LAYAWAYS
-- ============================================================
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'layaways'
ORDER BY ordinal_position;

-- ============================================================
-- 2. CONSTRAINTS DE LAYAWAYS
-- ============================================================
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'layaways'::regclass
ORDER BY conname;

-- ============================================================
-- 3. INDEXES DE LAYAWAYS
-- ============================================================
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'layaways'
  AND schemaname = 'public'
ORDER BY indexname;

-- ============================================================
-- 4. ESTRUCTURA DE LAYAWAY_PAYMENTS
-- ============================================================
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'layaway_payments'
ORDER BY ordinal_position;

-- ============================================================
-- 5. CONSTRAINTS DE LAYAWAY_PAYMENTS
-- ============================================================
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'layaway_payments'::regclass
ORDER BY conname;

-- ============================================================
-- 6. INDEXES DE LAYAWAY_PAYMENTS
-- ============================================================
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'layaway_payments'
  AND schemaname = 'public'
ORDER BY indexname;

-- ============================================================
-- 7. TRIGGER UPDATED_AT (LAYAWAY_PAYMENTS)
-- ============================================================
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'layaway_payments'
  AND trigger_schema = 'public';

-- ============================================================
-- 8. RLS POLICIES DE LAYAWAYS
-- ============================================================
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

-- ============================================================
-- 9. RLS POLICIES DE LAYAWAY_PAYMENTS
-- ============================================================
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

-- ============================================================
-- 10. VERIFICAR RLS HABILITADO
-- ============================================================
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('layaways', 'layaway_payments');

-- ============================================================
-- 11. VERIFICAR COMPATIBILIDAD: ORDERS NO ALTERADA
-- ============================================================
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
ORDER BY ordinal_position;

-- ============================================================
-- 12. VERIFICAR COMPATIBILIDAD: PRODUCTS NO ALTERADA
-- ============================================================
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
ORDER BY ordinal_position;

-- ============================================================
-- 13. VERIFICAR QUE NO HAY CRON JOBS RELACIONADOS
-- ============================================================
-- Nota: Esto es solo para verificar si se creó alguna tabla de cron
-- Los cron jobs están en OpenClaw, no en Supabase
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%cron%';

-- ============================================================
-- 14. VERIFICAR SI HAY DATOS TEST EN LAYAWAYS
-- ============================================================
SELECT COUNT(*) as total_layaways FROM layaways;

-- ============================================================
-- 15. VERIFICAR SI HAY DATOS TEST EN LAYAWAY_PAYMENTS
-- ============================================================
SELECT COUNT(*) as total_payments FROM layaway_payments;

-- ============================================================
-- 16. VERIFICAR FK CORRECTAS
-- ============================================================
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('layaways', 'layaway_payments')
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================
-- FIN DE VALIDACIÓN
-- ============================================================
