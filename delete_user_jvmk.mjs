/**
 * Delete user jvmk1804@gmail.com from Bagclue
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

const EMAIL = 'jvmk1804@gmail.com'

console.log('========================================')
console.log('DELETE USER: jvmk1804@gmail.com')
console.log('========================================\n')

async function deleteUser() {
  console.log(`[Deleting] ${EMAIL}`)
  
  try {
    // Get user by email from customer_profiles
    const { data: profile, error: profileError } = await supabase
      .from('customer_profiles')
      .select('id, user_id, email, created_at, welcome_email_sent_at')
      .eq('email', EMAIL)
      .single()
    
    if (profileError) {
      if (profileError.code === 'PGRST116') {
        console.log(`✅ Profile not found (already deleted or never existed)`)
      } else {
        console.log(`❌ Profile query failed: ${profileError.message}`)
      }
      return
    }
    
    console.log(`Found profile:`)
    console.log(`  - Profile ID: ${profile.id}`)
    console.log(`  - User ID: ${profile.user_id}`)
    console.log(`  - Created: ${profile.created_at}`)
    console.log(`  - Welcome email sent: ${profile.welcome_email_sent_at || 'NULL'}`)
    console.log('')
    
    // Delete user from auth.users (cascades to customer_profiles)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(profile.user_id)
    
    if (deleteError) {
      console.log(`❌ Delete failed: ${deleteError.message}`)
    } else {
      console.log(`✅ User deleted successfully`)
    }
    
  } catch (err) {
    console.log(`❌ Unexpected error: ${err.message}`)
  }
  
  console.log('')
  
  // Verify deletion
  console.log('========================================')
  console.log('VERIFICATION')
  console.log('========================================\n')
  
  const { data, error } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('email', EMAIL)
    .single()
  
  if (error && error.code === 'PGRST116') {
    console.log(`✅ ${EMAIL} - NOT FOUND (deleted successfully)`)
  } else if (error) {
    console.log(`⚠️  ${EMAIL} - Query error: ${error.message}`)
  } else {
    console.log(`❌ ${EMAIL} - STILL EXISTS (deletion failed)`)
  }
  
  console.log('\n========================================')
  console.log('Ready for new registration')
  console.log('========================================\n')
  console.log('User can now register with jvmk1804@gmail.com')
  console.log('Welcome email should arrive within 5 minutes')
  console.log('')
}

deleteUser()
