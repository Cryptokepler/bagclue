import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://orhjnwpbzxyqtyrayvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
)

const emails = ['densestore@gmail.com', 'cryptokepleroficial@gmail.com']
const userIds = ['e5b40df8-6289-4b0f-aaa5-b37caba30e87', '06b1158b-698e-49e3-876e-8fcf2bc99816']

console.log('='.repeat(70))
console.log('VALIDACIÓN POST-DELETE')
console.log('='.repeat(70))
console.log('')

let allClear = true

for (let i = 0; i < emails.length; i++) {
  const email = emails[i]
  const userId = userIds[i]
  
  console.log(`📧 Validando: ${email}`)
  
  // 1. Check auth.users
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const authUser = users.find(u => u.email === email)
  
  if (authUser) {
    console.log(`   ❌ auth.users: TODAVÍA EXISTE (user_id: ${authUser.id})`)
    allClear = false
  } else {
    console.log('   ✅ auth.users: NO EXISTE')
  }
  
  // 2. Check customer_profiles
  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('user_id', userId)
    .single()
  
  if (profile) {
    console.log(`   ❌ customer_profiles: TODAVÍA EXISTE (id: ${profile.id})`)
    allClear = false
  } else {
    console.log('   ✅ customer_profiles: NO EXISTE')
  }
  
  // 3. Check orphaned addresses (shouldn't exist, but double check)
  const { data: addresses } = await supabase
    .from('customer_addresses')
    .select('id')
    .eq('user_id', userId)
  
  if (addresses && addresses.length > 0) {
    console.log(`   ⚠️  customer_addresses: ${addresses.length} huérfanos encontrados`)
    allClear = false
  } else {
    console.log('   ✅ customer_addresses: Sin registros huérfanos')
  }
  
  console.log('')
}

console.log('='.repeat(70))
if (allClear) {
  console.log('✅ VALIDACIÓN: PASS')
  console.log('Todos los registros fueron eliminados correctamente.')
} else {
  console.log('❌ VALIDACIÓN: FAIL')
  console.log('Algunos registros todavía existen.')
}
console.log('='.repeat(70))
