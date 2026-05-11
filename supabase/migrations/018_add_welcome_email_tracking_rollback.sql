-- Rollback for Migration 018: Remove Welcome Email Tracking
-- WARNING: This will drop the welcome_email_sent_at column and its data

-- ========================================
-- 1. Drop index
-- ========================================

DROP INDEX IF EXISTS idx_customer_profiles_welcome_email_pending;

-- ========================================
-- 2. Drop column
-- ========================================

ALTER TABLE customer_profiles
DROP COLUMN IF EXISTS welcome_email_sent_at;
