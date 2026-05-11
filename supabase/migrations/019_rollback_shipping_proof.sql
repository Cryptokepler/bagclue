-- ============================================================================
-- ROLLBACK: Remove shipping proof support
-- ============================================================================
-- WARNING: Deletes all files in bucket and all metadata
-- ============================================================================

-- Step 1: Remove columns
ALTER TABLE orders 
DROP COLUMN IF EXISTS shipping_proof_url,
DROP COLUMN IF EXISTS shipping_proof_file_name,
DROP COLUMN IF EXISTS shipping_proof_file_type,
DROP COLUMN IF EXISTS shipping_proof_file_size,
DROP COLUMN IF EXISTS shipping_proof_uploaded_at;

-- Step 2: Delete bucket (requires deleting all files first via Supabase Dashboard)
-- Manual step: Go to Storage → shipping-proofs → Delete all files
-- Then run:
-- DELETE FROM storage.buckets WHERE id = 'shipping-proofs';
