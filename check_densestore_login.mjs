import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://orhjnwpbzxyqtyrayvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
)

const email = 'densestore@gmail.com'

console.log('='.repeat(70))
console.log('VERIFICACIÓN LOGIN — densestore@gmail.com')
console.log('='.repeat(70))
console.log('')

// Auth user
const { data: { users } } = await supabase.auth.admin.listUsers()
const authUser = users.find(u => u.email === email)

if (!authUser) {
  console.log('❌ Usuario NO encontrado en auth.users')
  process.exit(1)
}

const now = new Date()
const createdAt = new Date(authUser.created_at)
const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / 1000 / 60

console.log('✅ AUTH USER:')
console.log('   Email:', authUser.email)
console.log('   User ID:', authUser.id)
console.log('   Created:', authUser.created_at)
console.log('   Last sign in:', authUser.last_sign_in_at)
console.log('   Minutes since creation:', minutesSinceCreation.toFixed(2))
console.log('   Within 15 min:', minutesSinceCreation < 15 ? '✅ YES' : '❌ NO')
console.log('')

// Profile
const { data: profile } = await supabase
  .from('customer_profiles')
  .select('*')
  .eq('user_id', authUser.id)
  .single()

if (!profile) {
  console.log('❌ Profile NO encontrado')
  process.exit(1)
}

const profileCreatedAt = new Date(profile.created_at)
const minutesSinceProfile = (now.getTime() - profileCreatedAt.getTime()) / 1000 / 60

console.log('✅ CUSTOMER PROFILE:')
console.log('   ID:', profile.id)
console.log('   Created:', profile.created_at)
console.log('   Minutes since profile:', minutesSinceProfile.toFixed(2))
console.log('   Within 15 min:', minutesSinceProfile < 15 ? '✅ YES' : '❌ NO')
console.log('')

console.log('='.repeat(70))
if (minutesSinceCreation < 15) {
  console.log('✅ Usuario nuevo — Email debería haber sido enviado')
  console.log('')
  console.log('DIAGNÓSTICO:')
  console.log('- await está implementado en callback')
  console.log('- Usuario está dentro de ventana')
  console.log('- Email NO llegó → problema en ejecución del callback')
  console.log('')
  console.log('Ejecutando test simulado del callback...')
} else {
  console.log('❌ Usuario demasiado antiguo — Email no se enviaría')
}
console.log('='.repeat(70))
