import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://orhjnwpbzxyqtyrayvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
)

const users = [
  { email: 'densestore@gmail.com', userId: 'e5b40df8-6289-4b0f-aaa5-b37caba30e87' },
  { email: 'cryptokepleroficial@gmail.com', userId: '06b1158b-698e-49e3-876e-8fcf2bc99816' }
]

console.log('='.repeat(70))
console.log('BORRADO DE USUARIOS DE PRUEBA')
console.log('='.repeat(70))
console.log('')

for (const { email, userId } of users) {
  console.log(`📧 Borrando: ${email}`)
  console.log(`   User ID: ${userId}`)
  console.log('')
  
  // 1. Delete customer_profiles
  console.log('   [1/2] Borrando customer_profiles...')
  const { error: profileError } = await supabase
    .from('customer_profiles')
    .delete()
    .eq('user_id', userId)
  
  if (profileError) {
    console.error('   ❌ Error borrando customer_profiles:', profileError.message)
  } else {
    console.log('   ✅ customer_profiles eliminado')
  }
  
  // 2. Delete auth user
  console.log('   [2/2] Borrando auth.users...')
  const { error: authError } = await supabase.auth.admin.deleteUser(userId)
  
  if (authError) {
    console.error('   ❌ Error borrando auth.users:', authError.message)
  } else {
    console.log('   ✅ auth.users eliminado')
  }
  
  console.log('')
}

console.log('='.repeat(70))
console.log('BORRADO COMPLETADO')
console.log('='.repeat(70))
