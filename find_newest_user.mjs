import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://orhjnwpbzxyqtyrayvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
)

console.log('='.repeat(70))
console.log('BUSCANDO USUARIO MÁS RECIENTE')
console.log('='.repeat(70))
console.log('')

const { data: { users } } = await supabase.auth.admin.listUsers()

// Sort by created_at descending
const sorted = users.sort((a, b) => 
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
)

const newest = sorted[0]
const now = new Date()
const createdAt = new Date(newest.created_at)
const minutesAgo = (now.getTime() - createdAt.getTime()) / 1000 / 60

console.log('USUARIO MÁS RECIENTE:')
console.log('  Email:', newest.email)
console.log('  User ID:', newest.id)
console.log('  Created:', newest.created_at)
console.log('  Minutes ago:', minutesAgo.toFixed(2))
console.log('  Within 20 min:', minutesAgo < 20 ? '✅ YES' : '❌ NO')
console.log('  Last sign in:', newest.last_sign_in_at)
console.log('')

// Check profile
const { data: profile } = await supabase
  .from('customer_profiles')
  .select('*')
  .eq('user_id', newest.id)
  .single()

if (profile) {
  const profileCreatedAt = new Date(profile.created_at)
  const profileMinutes = (now.getTime() - profileCreatedAt.getTime()) / 1000 / 60
  
  console.log('CUSTOMER PROFILE:')
  console.log('  ID:', profile.id)
  console.log('  Created:', profile.created_at)
  console.log('  Minutes ago:', profileMinutes.toFixed(2))
  console.log('  Within 20 min:', profileMinutes < 20 ? '✅ YES' : '❌ NO')
} else {
  console.log('❌ No profile found')
}

console.log('')
console.log('='.repeat(70))
console.log('Ejecutando test del callback...')
console.log('='.repeat(70))
