-- Migration 020: Add shipping_proof_path column to orders table
-- Purpose: Store the actual storage path instead of relying on reconstructing from file name
-- Date: 2026-05-11
-- Author: Kepler (fix for "File not found in storage" bug)

-- Add column for storage path
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_proof_path TEXT NULL;

-- Add comment for documentation
COMMENT ON COLUMN orders.shipping_proof_path IS 'Full storage path for shipping proof file (e.g., {orderId}/{timestamp}_{sanitizedFileName})';

-- No backfill needed: existing orders can regenerate path from shipping_proof_url if needed
-- New uploads will populate this field automatically
