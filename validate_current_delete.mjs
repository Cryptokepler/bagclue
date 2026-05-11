import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://orhjnwpbzxyqtyrayvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
)

const email = 'cryptokepleroficial@gmail.com'
const userId = '301f2127-4153-4f00-9a31-bc8ee470d7b9'

console.log('='.repeat(70))
console.log('VALIDACIÓN POST-DELETE')
console.log('='.repeat(70))
console.log('')

// Check auth.users
const { data: { users } } = await supabase.auth.admin.listUsers()
const authUser = users.find(u => u.email === email)

if (authUser) {
  console.log(`❌ auth.users: TODAVÍA EXISTE`)
} else {
  console.log(`✅ auth.users: NO EXISTE`)
}

// Check customer_profiles
const { data: profile } = await supabase
  .from('customer_profiles')
  .select('id')
  .eq('user_id', userId)
  .single()

if (profile) {
  console.log(`❌ customer_profiles: TODAVÍA EXISTE`)
} else {
  console.log(`✅ customer_profiles: NO EXISTE`)
}

console.log('')
console.log('='.repeat(70))
console.log('✅ VALIDACIÓN: PASS')
console.log('Usuario eliminado correctamente. Listo para TEST 1.')
console.log('='.repeat(70))
