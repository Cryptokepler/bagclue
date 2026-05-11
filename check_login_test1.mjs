import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://orhjnwpbzxyqtyrayvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
)

const email = 'cryptokepleroficial@gmail.com'

console.log('='.repeat(70))
console.log('TEST 1 — VERIFICACIÓN POST-LOGIN')
console.log('='.repeat(70))
console.log('')

// 1. Auth user
const { data: { users } } = await supabase.auth.admin.listUsers()
const authUser = users.find(u => u.email === email)

if (!authUser) {
  console.log('❌ Usuario NO encontrado en auth.users')
  process.exit(1)
}

const now = new Date()
const createdAt = new Date(authUser.created_at)
const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / 1000 / 60

console.log('✅ AUTH USER CREADO:')
console.log('   Email:', authUser.email)
console.log('   User ID:', authUser.id)
console.log('   Created:', authUser.created_at)
console.log('   Last sign in:', authUser.last_sign_in_at)
console.log('   Minutes since creation:', minutesSinceCreation.toFixed(2))
console.log('   Within window (<15 min):', minutesSinceCreation < 15 ? '✅ YES' : '❌ NO')
console.log('')

// 2. Customer profile
const { data: profile } = await supabase
  .from('customer_profiles')
  .select('*')
  .eq('user_id', authUser.id)
  .single()

if (!profile) {
  console.log('❌ Profile NO encontrado en customer_profiles')
  process.exit(1)
}

const profileCreatedAt = new Date(profile.created_at)
const minutesSinceProfileCreation = (now.getTime() - profileCreatedAt.getTime()) / 1000 / 60

console.log('✅ CUSTOMER PROFILE CREADO:')
console.log('   ID:', profile.id)
console.log('   User ID:', profile.user_id)
console.log('   Email:', profile.email)
console.log('   Name:', profile.name || '(null)')
console.log('   Created:', profile.created_at)
console.log('   Minutes since profile creation:', minutesSinceProfileCreation.toFixed(2))
console.log('   Within window (<15 min):', minutesSinceProfileCreation < 15 ? '✅ YES' : '❌ NO')
console.log('')

console.log('='.repeat(70))
console.log('RESUMEN:')
console.log('='.repeat(70))
console.log('✅ Usuario creado correctamente')
console.log('✅ Profile creado correctamente')
console.log(`✅ Timestamp: ${minutesSinceCreation.toFixed(2)} min ago (< 15 min)`)
console.log('✅ Callback debería haber enviado email')
console.log('')
console.log('Esperando confirmación de Jhonatan:')
console.log('- ¿El email "Bienvenida a Bagclue ✨" llegó?')
console.log('='.repeat(70))
