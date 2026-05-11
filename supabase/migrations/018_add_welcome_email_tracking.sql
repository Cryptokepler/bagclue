-- Migration 018: Add Welcome Email Tracking to customer_profiles
-- Purpose: Enable CRON-based reliable delivery of welcome emails
-- Strategy: Flag-based approach to prevent duplicates and enable retry logic

-- ========================================
-- 1. Add welcome_email_sent_at column
-- ========================================

ALTER TABLE customer_profiles
ADD COLUMN welcome_email_sent_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN customer_profiles.welcome_email_sent_at IS 'Timestamp when welcome email was successfully sent. NULL = not sent yet.';

-- ========================================
-- 2. Backfill existing users to prevent retroactive emails
-- ========================================

-- Mark all existing users as already welcomed
-- This ensures only NEW users (created after this migration) will receive welcome emails
UPDATE customer_profiles
SET welcome_email_sent_at = NOW()
WHERE welcome_email_sent_at IS NULL;

-- ========================================
-- 3. Index for CRON query performance
-- ========================================

-- CRON will query: WHERE welcome_email_sent_at IS NULL AND email IS NOT NULL
CREATE INDEX idx_customer_profiles_welcome_email_pending 
ON customer_profiles(welcome_email_sent_at, created_at)
WHERE welcome_email_sent_at IS NULL AND email IS NOT NULL;

COMMENT ON INDEX idx_customer_profiles_welcome_email_pending IS 'Optimizes CRON query for pending welcome emails';
