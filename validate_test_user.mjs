/**
 * Validate test user state in DB
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load .env.local
const envFile = readFileSync('.env.local', 'utf-8')
const envVars = {}
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_EMAIL = 'cryptokepleroficial@gmail.com'

console.log('========================================')
console.log('TEST USER VALIDATION')
console.log('========================================\n')

async function validateUser() {
  // Check customer_profiles
  console.log('[Check 1] customer_profiles...')
  const { data: profile, error: profileError } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('email', TEST_EMAIL)
    .single()
  
  if (profileError) {
    console.log('❌ FAIL: Profile not found')
    console.log('Error:', profileError.message)
    console.log('\n⚠️  DIAGNOSIS: Trigger may have failed to create profile')
    return
  }
  
  console.log('✅ PASS: customer_profile exists')
  console.log('Profile details:')
  console.log(`  - ID: ${profile.id}`)
  console.log(`  - User ID: ${profile.user_id}`)
  console.log(`  - Email: ${profile.email}`)
  console.log(`  - Name: ${profile.name || 'NULL'}`)
  console.log(`  - Created: ${profile.created_at}`)
  console.log(`  - welcome_email_sent_at: ${profile.welcome_email_sent_at || 'NULL'}`)
  console.log('')
  
  // Check auth.users (using admin API)
  console.log('[Check 2] auth.users...')
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.user_id)
  
  if (authError) {
    console.log('❌ FAIL: auth.users query failed')
    console.log('Error:', authError.message)
    return
  }
  
  console.log('✅ PASS: auth.users entry exists')
  console.log(`  - User ID: ${authUser.user.id}`)
  console.log(`  - Email: ${authUser.user.email}`)
  console.log(`  - Created: ${authUser.user.created_at}`)
  console.log('')
  
  // Check welcome_email_sent_at status
  console.log('[Check 3] welcome_email_sent_at status...')
  if (profile.welcome_email_sent_at === null) {
    console.log('✅ PASS: welcome_email_sent_at IS NULL')
    console.log('✅ User is ready for CRON processing')
    console.log('')
    console.log('========================================')
    console.log('NEXT: Execute CRON manually')
    console.log('========================================')
    console.log('')
    console.log('Run from environment with CRON_SECRET:')
    console.log('')
    console.log('curl -X GET https://bagclue.vercel.app/api/cron/welcome-email \\')
    console.log('  -H "Authorization: Bearer $CRON_SECRET"')
    console.log('')
  } else {
    console.log('❌ FAIL: welcome_email_sent_at is NOT NULL')
    console.log(`   Value: ${profile.welcome_email_sent_at}`)
    console.log('')
    console.log('⚠️  DIAGNOSIS:')
    
    const sentAt = new Date(profile.welcome_email_sent_at)
    const createdAt = new Date(profile.created_at)
    const diffMinutes = (sentAt - createdAt) / 1000 / 60
    
    console.log(`   - Profile created: ${profile.created_at}`)
    console.log(`   - Email marked sent: ${profile.welcome_email_sent_at}`)
    console.log(`   - Time difference: ${diffMinutes.toFixed(2)} minutes`)
    console.log('')
    
    if (diffMinutes < 1) {
      console.log('⚠️  Sent timestamp is within 1 minute of creation')
      console.log('   Possible causes:')
      console.log('   1. Migration backfill caught this user (created during migration)')
      console.log('   2. CRON already ran automatically')
      console.log('   3. Auth callback somehow sent email (should be disabled)')
    } else {
      console.log('⚠️  Email appears to have been sent after creation')
      console.log('   Likely: CRON already processed this user')
    }
  }
}

validateUser()
