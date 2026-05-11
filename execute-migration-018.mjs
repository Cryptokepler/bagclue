/**
 * Execute Migration 018: Add welcome_email_sent_at to customer_profiles
 * 
 * STEPS:
 * 1. Manually add column (requires SQL access in Supabase Studio)
 * 2. Backfill existing users (can be done via Supabase client)
 * 
 * This script handles Step 2 (backfill)
 * Step 1 must be done in Supabase Studio SQL Editor:
 * 
 * ALTER TABLE customer_profiles
 * ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ NULL;
 * 
 * CREATE INDEX IF NOT EXISTS idx_customer_profiles_welcome_email_pending 
 * ON customer_profiles(welcome_email_sent_at, created_at)
 * WHERE welcome_email_sent_at IS NULL AND email IS NOT NULL;
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function executeBackfill() {
  console.log('[Migration 018] Starting backfill...')
  
  try {
    // Check if column exists by querying a single row
    const { data: testData, error: testError } = await supabase
      .from('customer_profiles')
      .select('id, welcome_email_sent_at')
      .limit(1)
    
    if (testError) {
      console.error('[Migration 018] ❌ Column does not exist or query failed:', testError.message)
      console.log('[Migration 018] Run this SQL in Supabase Studio first:')
      console.log('')
      console.log('ALTER TABLE customer_profiles')
      console.log('ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ NULL;')
      console.log('')
      console.log('CREATE INDEX IF NOT EXISTS idx_customer_profiles_welcome_email_pending')
      console.log('ON customer_profiles(welcome_email_sent_at, created_at)')
      console.log('WHERE welcome_email_sent_at IS NULL AND email IS NOT NULL;')
      console.log('')
      process.exit(1)
    }
    
    console.log('[Migration 018] ✅ Column exists')
    
    // Backfill: Mark all existing users as already welcomed
    console.log('[Migration 018] Backfilling existing users...')
    
    const { data, error, count } = await supabase
      .from('customer_profiles')
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .is('welcome_email_sent_at', null)
      .select('id', { count: 'exact' })
    
    if (error) {
      console.error('[Migration 018] ❌ Backfill failed:', error.message)
      process.exit(1)
    }
    
    console.log(`[Migration 018] ✅ Backfilled ${count || 0} existing users`)
    console.log('[Migration 018] ✅ Migration completed successfully')
    console.log('[Migration 018] New users will now receive welcome emails via CRON')
    
  } catch (err) {
    console.error('[Migration 018] ❌ Fatal error:', err.message)
    process.exit(1)
  }
}

executeBackfill()
