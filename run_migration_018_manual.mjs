/**
 * Migration 018 - Manual Execution Guide + Validations
 * 
 * IMPORTANT: ALTER TABLE and CREATE INDEX must be executed manually in Supabase Studio
 * This script only runs validations and backfill (if column already exists)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load .env.local manually
const envFile = readFileSync('.env.local', 'utf-8')
const envVars = {}
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

console.log('========================================')
console.log('MIGRATION 018 - MANUAL EXECUTION GUIDE')
console.log('========================================\n')

console.log('⚠️  Supabase REST API does not support ALTER TABLE or CREATE INDEX')
console.log('You must execute these SQL statements manually in Supabase Studio:\n')

console.log('URL: https://supabase.com/dashboard/project/orhjnwpbzxyqtyrayvoi')
console.log('Navigate to: SQL Editor\n')

console.log('========================================')
console.log('SQL TO EXECUTE:')
console.log('========================================\n')

console.log(`-- Migration 018: Add Welcome Email Tracking
ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN customer_profiles.welcome_email_sent_at IS 'Timestamp when welcome email was successfully sent. NULL = not sent yet.';

-- Backfill existing users
UPDATE customer_profiles
SET welcome_email_sent_at = NOW()
WHERE welcome_email_sent_at IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_customer_profiles_welcome_email_pending 
ON customer_profiles(welcome_email_sent_at, created_at)
WHERE welcome_email_sent_at IS NULL AND email IS NOT NULL;

COMMENT ON INDEX idx_customer_profiles_welcome_email_pending IS 'Optimizes CRON query for pending welcome emails';
`)

console.log('\n========================================')
console.log('VALIDATIONS (run AFTER executing SQL above):')
console.log('========================================\n')

console.log(`-- Validation 1: Column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customer_profiles'
AND column_name = 'welcome_email_sent_at';

-- Expected: 1 row with timestamp with time zone | YES

-- Validation 2: Backfill complete
SELECT COUNT(*) FROM customer_profiles WHERE welcome_email_sent_at IS NULL;

-- Expected: 0

-- Validation 3: Index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'customer_profiles'
AND indexname = 'idx_customer_profiles_welcome_email_pending';

-- Expected: 1 row
`)

console.log('\n========================================')
console.log('Checking current status...')
console.log('========================================\n')

async function checkStatus() {
  // Check if column exists
  console.log('[Status Check 1] Testing if column exists...')
  const { data: testData, error: testError } = await supabase
    .from('customer_profiles')
    .select('id, welcome_email_sent_at')
    .limit(1)
  
  if (testError) {
    if (testError.message.includes('column "welcome_email_sent_at" does not exist')) {
      console.log('❌ Column does NOT exist yet')
      console.log('→ Execute the SQL above in Supabase Studio SQL Editor\n')
      return false
    } else {
      console.error('❌ Query failed:', testError.message)
      return false
    }
  }
  
  console.log('✅ Column EXISTS\n')
  
  // Check NULL count
  console.log('[Status Check 2] Checking NULL count...')
  const { count: nullCount, error: countError } = await supabase
    .from('customer_profiles')
    .select('id', { count: 'exact', head: true })
    .is('welcome_email_sent_at', null)
  
  if (countError) {
    console.error('❌ Count query failed:', countError.message)
    return false
  }
  
  console.log(`NULL count: ${nullCount}`)
  
  if (nullCount === 0) {
    console.log('✅ Backfill COMPLETE (all existing users marked)\n')
  } else {
    console.log(`⚠️  ${nullCount} users have NULL (backfill may be incomplete or new users created)\n`)
  }
  
  return true
}

checkStatus().then(success => {
  if (success) {
    console.log('========================================')
    console.log('✅ Migration 018 appears to be applied')
    console.log('========================================\n')
    console.log('Run the validation SQL in Supabase Studio to confirm index exists.')
  } else {
    console.log('========================================')
    console.log('⚠️  Migration 018 NOT YET applied')
    console.log('========================================\n')
    console.log('Execute the SQL above in Supabase Studio SQL Editor.')
  }
})
