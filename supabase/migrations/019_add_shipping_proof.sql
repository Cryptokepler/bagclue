-- ============================================================================
-- MIGRATION: Add shipping proof support to orders
-- ============================================================================
-- Date: 2026-05-11
-- Purpose: Allow admin to upload shipping proof/label for customer view
-- Rollback: See 019_rollback_shipping_proof.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: Add columns to orders table
-- ============================================================================

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_proof_url TEXT,
ADD COLUMN IF NOT EXISTS shipping_proof_file_name TEXT,
ADD COLUMN IF NOT EXISTS shipping_proof_file_type TEXT,
ADD COLUMN IF NOT EXISTS shipping_proof_file_size INTEGER,
ADD COLUMN IF NOT EXISTS shipping_proof_uploaded_at TIMESTAMPTZ;

-- ============================================================================
-- STEP 2: Create storage bucket for shipping proofs
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('shipping-proofs', 'shipping-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 3: Add comments (documentation)
-- ============================================================================

COMMENT ON COLUMN orders.shipping_proof_url IS 'Signed URL del comprobante/guía de envío (1 año expiración)';
COMMENT ON COLUMN orders.shipping_proof_file_name IS 'Nombre original del archivo subido';
COMMENT ON COLUMN orders.shipping_proof_file_type IS 'Tipo MIME: image/jpeg, image/png, application/pdf';
COMMENT ON COLUMN orders.shipping_proof_file_size IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN orders.shipping_proof_uploaded_at IS 'Timestamp cuando admin subió el archivo';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
