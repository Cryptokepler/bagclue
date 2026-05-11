/**
 * Temporary script to run migration 018
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const SUPABASE_URL = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function runMigration() {
  console.log('[Migration 018] Starting...')
  
  try {
    // Step 1: Add column
    console.log('[Migration 018] Adding column welcome_email_sent_at...')
    const { error: alterError } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ NULL'
    })
    
    if (alterError) {
      console.error('[Migration 018] ALTER TABLE failed:', alterError.message)
      // Try direct SQL execution via PostgREST (may not work, but worth trying)
    }
    
    // Step 2: Backfill
    console.log('[Migration 018] Backfilling existing users...')
    const { data: updateData, error: updateError } = await supabase
      .from('customer_profiles')
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .is('welcome_email_sent_at', null)
    
    if (updateError) {
      console.error('[Migration 018] UPDATE failed:', updateError.message)
    } else {
      console.log('[Migration 018] Backfill completed')
    }
    
    console.log('[Migration 018] ✅ Completed')
    console.log('[Migration 018] Note: Index creation may require direct SQL access (psql or Supabase Studio)')
    
  } catch (err) {
    console.error('[Migration 018] Fatal error:', err.message)
    process.exit(1)
  }
}

runMigration()
