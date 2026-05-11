import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://orhjnwpbzxyqtyrayvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
)

const email = 'cryptokepleroficial@gmail.com'
const userId = '301f2127-4153-4f00-9a31-bc8ee470d7b9'

console.log('='.repeat(70))
console.log('BORRANDO USUARIO DE PRUEBA ACTUAL')
console.log('='.repeat(70))
console.log('')
console.log(`📧 Email: ${email}`)
console.log(`   User ID: ${userId}`)
console.log('')

// 1. Delete customer_profiles
console.log('[1/2] Borrando customer_profiles...')
const { error: profileError } = await supabase
  .from('customer_profiles')
  .delete()
  .eq('user_id', userId)

if (profileError) {
  console.error('❌ Error:', profileError.message)
} else {
  console.log('✅ customer_profiles eliminado')
}

// 2. Delete auth user
console.log('[2/2] Borrando auth.users...')
const { error: authError } = await supabase.auth.admin.deleteUser(userId)

if (authError) {
  console.error('❌ Error:', authError.message)
} else {
  console.log('✅ auth.users eliminado')
}

console.log('')
console.log('='.repeat(70))
console.log('BORRADO COMPLETADO')
console.log('='.repeat(70))
