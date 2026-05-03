-- ============================================================================
-- VALIDATION QUERIES FOR MIGRATION 024: customer_addresses
-- Execute these queries in Supabase SQL Editor AFTER running the migration
-- ============================================================================

-- ============================================================================
-- 1. VERIFY TABLE EXISTS
-- ============================================================================
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name = 'customer_addresses';
-- Expected: 1 row, table_type = 'BASE TABLE'

-- ============================================================================
-- 2. VERIFY COLUMNS (16 expected, including delivery_references)
-- ============================================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'customer_addresses'
ORDER BY ordinal_position;
-- Expected columns:
-- id, user_id, full_name, phone_country_code, phone_country_iso, phone,
-- country, state, city, postal_code, address_line1, address_line2,
-- delivery_references, is_default, created_at, updated_at

-- ============================================================================
-- 3. VERIFY delivery_references EXISTS (NOT "references")
-- ============================================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'customer_addresses'
  AND column_name = 'delivery_references';
-- Expected: 1 row, data_type = 'text'

SELECT column_name
FROM information_schema.columns
WHERE table_name = 'customer_addresses'
  AND column_name = 'references';
-- Expected: 0 rows (column "references" should NOT exist)

-- ============================================================================
-- 4. VERIFY phone_country_code AND phone_country_iso EXIST
-- ============================================================================
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'customer_addresses'
  AND column_name IN ('phone_country_code', 'phone_country_iso');
-- Expected: 2 rows
--   phone_country_code | text | '+52'::text
--   phone_country_iso  | text | 'MX'::text

-- ============================================================================
-- 5. VERIFY FOREIGN KEY (user_id → auth.users ON DELETE CASCADE)
-- ============================================================================
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'customer_addresses';
-- Expected: 1 row
--   column_name: user_id
--   foreign_table: users
--   foreign_column: id
--   delete_rule: CASCADE

-- ============================================================================
-- 6. VERIFY INDEXES (4 expected)
-- ============================================================================
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'customer_addresses'
ORDER BY indexname;
-- Expected: 4 indexes
--   1. customer_addresses_pkey (PRIMARY KEY on id)
--   2. idx_customer_addresses_user_id
--   3. idx_customer_addresses_is_default (partial: WHERE is_default = true)
--   4. idx_customer_addresses_user_default (UNIQUE partial: WHERE is_default = true)

-- ============================================================================
-- 7. VERIFY UNIQUE PARTIAL INDEX FOR DEFAULT
-- ============================================================================
SELECT
  i.relname AS index_name,
  pg_get_indexdef(i.oid) AS index_definition
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
WHERE t.relname = 'customer_addresses'
  AND i.relname = 'idx_customer_addresses_user_default';
-- Expected: Index definition includes:
--   UNIQUE INDEX
--   ON customer_addresses(user_id)
--   WHERE (is_default = true)

-- ============================================================================
-- 8. VERIFY RLS IS ENABLED
-- ============================================================================
SELECT 
  tablename, 
  rowsecurity
FROM pg_tables
WHERE tablename = 'customer_addresses';
-- Expected: rowsecurity = true

-- ============================================================================
-- 9. VERIFY POLICIES (4 expected, all TO authenticated)
-- ============================================================================
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
-- Expected: 4 policies, all with roles = '{authenticated}'
--   1. Customers can delete own addresses | DELETE | {authenticated} | (auth.uid() = user_id) | NULL
--   2. Customers can insert own addresses | INSERT | {authenticated} | NULL | (auth.uid() = user_id)
--   3. Customers can update own addresses | UPDATE | {authenticated} | (auth.uid() = user_id) | (auth.uid() = user_id)
--   4. Customers can view own addresses   | SELECT | {authenticated} | (auth.uid() = user_id) | NULL

-- ============================================================================
-- 10. VERIFY NO PUBLIC POLICIES
-- ============================================================================
SELECT 
  policyname, 
  roles, 
  qual, 
  with_check
FROM pg_policies
WHERE tablename = 'customer_addresses'
  AND (
    qual = 'true' 
    OR with_check = 'true' 
    OR 'authenticated' != ALL(roles)
  );
-- Expected: 0 rows (no public policies)

-- ============================================================================
-- 11. VERIFY TRIGGER updated_at EXISTS
-- ============================================================================
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'customer_addresses';
-- Expected: 1 row
--   trigger_name: set_customer_addresses_updated_at
--   event_manipulation: UPDATE
--   action_statement: EXECUTE FUNCTION update_updated_at_column()

-- ============================================================================
-- 12. FUNCTIONAL TEST: UNIQUE DEFAULT CONSTRAINT
-- ============================================================================
-- WARNING: This test will insert and delete test data
-- Only run if you're comfortable with temporary test data

DO $$
DECLARE
  test_user_id UUID;
  first_addr_id UUID;
BEGIN
  -- Get a real user_id from auth.users (or skip if no users exist)
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'SKIPPED: No users in auth.users to test with';
    RETURN;
  END IF;
  
  -- Insert first default address
  INSERT INTO customer_addresses (
    user_id, full_name, country, city, address_line1, is_default
  ) VALUES (
    test_user_id, 'Test Address 1', 'México', 'CDMX', 'Calle Test 1', true
  ) RETURNING id INTO first_addr_id;
  
  RAISE NOTICE 'OK: First default address inserted (id: %)', first_addr_id;
  
  -- Try to insert second default for same user (should fail with error 23505)
  BEGIN
    INSERT INTO customer_addresses (
      user_id, full_name, country, city, address_line1, is_default
    ) VALUES (
      test_user_id, 'Test Address 2', 'México', 'CDMX', 'Calle Test 2', true
    );
    
    -- If we reach here, constraint failed
    RAISE EXCEPTION 'FAILED: Second default address was allowed (unique constraint not working)';
    
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE 'OK: Unique constraint working correctly (error 23505 as expected)';
  END;
  
  -- Cleanup
  DELETE FROM customer_addresses WHERE id = first_addr_id;
  RAISE NOTICE 'OK: Test data cleaned up';
  
  RAISE NOTICE 'SUCCESS: Unique default constraint validated ✅';
  
END $$;

-- ============================================================================
-- 13. SUMMARY CHECK
-- ============================================================================
-- Run all checks in one query for quick overview
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

-- ============================================================================
-- END OF VALIDATION QUERIES
-- Expected: All checks should show ✅ PASS
-- ============================================================================
