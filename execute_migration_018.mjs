/**
 * Execute Migration 018: Add welcome_email_sent_at to customer_profiles
 * Run validations and report results
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

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function executeMigration() {
  console.log('[Migration 018] Starting execution...\n')
  
  try {
    // Step 1: Add column (idempotent)
    console.log('[Step 1] Adding column IF NOT EXISTS...')
    const { error: alterError } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE customer_profiles
        ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ NULL;
        
        COMMENT ON COLUMN customer_profiles.welcome_email_sent_at IS 'Timestamp when welcome email was successfully sent. NULL = not sent yet.';
      `
    }).catch(async () => {
      // If rpc('exec') doesn't exist, try raw SQL via from/insert (not ideal but may work)
      console.log('[Step 1] RPC not available, attempting raw query...')
      // Note: Supabase client doesn't have direct raw SQL execution via REST API
      // We'll need to use individual operations
      return { error: new Error('RPC exec not available') }
    })
    
    // Alternative: Use Supabase's schema builder (won't work for ALTER TABLE)
    // We need to check if column exists first
    const { data: columnCheck, error: columnCheckError } = await supabase
      .from('customer_profiles')
      .select('id, welcome_email_sent_at')
      .limit(1)
    
    if (columnCheckError && columnCheckError.message.includes('column "welcome_email_sent_at" does not exist')) {
      console.log('❌ Column does not exist and cannot be created via REST API')
      console.log('\n⚠️  MANUAL EXECUTION REQUIRED:')
      console.log('\nGo to: https://supabase.com/dashboard/project/orhjnwpbzxyqtyrayvoi')
      console.log('Navigate to: SQL Editor')
      console.log('Paste and execute:\n')
      console.log('ALTER TABLE customer_profiles')
      console.log('ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ NULL;\n')
      console.log('COMMENT ON COLUMN customer_profiles.welcome_email_sent_at IS \'Timestamp when welcome email was successfully sent. NULL = not sent yet.\';\n')
      console.log('CREATE INDEX IF NOT EXISTS idx_customer_profiles_welcome_email_pending')
      console.log('ON customer_profiles(welcome_email_sent_at, created_at)')
      console.log('WHERE welcome_email_sent_at IS NULL AND email IS NOT NULL;\n')
      process.exit(1)
    } else if (columnCheckError) {
      console.error('❌ Column check failed:', columnCheckError.message)
      process.exit(1)
    } else {
      console.log('✅ Column exists (already created or IF NOT EXISTS worked)')
    }
    
    // Step 2: Backfill existing users
    console.log('\n[Step 2] Backfilling existing users...')
    const { data: updateData, error: updateError } = await supabase
      .from('customer_profiles')
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .is('welcome_email_sent_at', null)
      .select('id', { count: 'exact' })
    
    if (updateError) {
      console.error('❌ Backfill failed:', updateError.message)
      process.exit(1)
    }
    
    const backfillCount = updateData?.length || 0
    console.log(`✅ Backfilled ${backfillCount} existing users`)
    
    console.log('\n[Migration 018] ✅ Execution completed')
    console.log('\n⚠️  NOTE: Index creation requires SQL Editor (cannot be done via REST API)')
    console.log('Execute this SQL in Supabase Studio SQL Editor:\n')
    console.log('CREATE INDEX IF NOT EXISTS idx_customer_profiles_welcome_email_pending')
    console.log('ON customer_profiles(welcome_email_sent_at, created_at)')
    console.log('WHERE welcome_email_sent_at IS NULL AND email IS NOT NULL;\n')
    
  } catch (err) {
    console.error('❌ Fatal error:', err.message)
    process.exit(1)
  }
}

async function runValidations() {
  console.log('\n========================================')
  console.log('VALIDATIONS')
  console.log('========================================\n')
  
  // Validation 1: Column exists
  console.log('[Validation 1] Checking if column exists...')
  const { data: colData, error: colError } = await supabase
    .from('customer_profiles')
    .select('id, welcome_email_sent_at')
    .limit(1)
  
  if (colError) {
    console.log('❌ FAIL: Column does not exist')
    console.log('Error:', colError.message)
  } else {
    console.log('✅ PASS: Column exists')
  }
  
  // Validation 2: Backfill complete (count NULL values)
  console.log('\n[Validation 2] Checking backfill (NULL count should be 0)...')
  const { count: nullCount, error: nullError } = await supabase
    .from('customer_profiles')
    .select('id', { count: 'exact', head: true })
    .is('welcome_email_sent_at', null)
  
  if (nullError) {
    console.log('❌ FAIL: Count query failed')
    console.log('Error:', nullError.message)
  } else {
    console.log(`Count: ${nullCount}`)
    if (nullCount === 0) {
      console.log('✅ PASS: All existing users backfilled')
    } else {
      console.log(`⚠️  WARNING: ${nullCount} users still have NULL (may be newly created during migration)`)
    }
  }
  
  // Validation 3: Index exists (cannot query pg_indexes via REST API easily)
  console.log('\n[Validation 3] Index creation check...')
  console.log('⚠️  Cannot verify index via REST API')
  console.log('Run this SQL in Supabase Studio SQL Editor to verify:\n')
  console.log('SELECT indexname, indexdef')
  console.log('FROM pg_indexes')
  console.log('WHERE tablename = \'customer_profiles\'')
  console.log('AND indexname = \'idx_customer_profiles_welcome_email_pending\';\n')
  console.log('Expected: 1 row\n')
}

async function main() {
  await executeMigration()
  await runValidations()
}

main()
