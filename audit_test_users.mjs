import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://orhjnwpbzxyqtyrayvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
)

const emails = ['densestore@gmail.com', 'cryptokepleroficial@gmail.com']

console.log('='.repeat(70))
console.log('AUDITORÍA DE USUARIOS DE PRUEBA')
console.log('='.repeat(70))
console.log('')

for (const email of emails) {
  console.log(`📧 EMAIL: ${email}`)
  console.log('-'.repeat(70))
  
  // 1. Auth user
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const authUser = users.find(u => u.email === email)
  
  if (authUser) {
    console.log('✅ AUTH.USERS:')
    console.log('   User ID:', authUser.id)
    console.log('   Created:', authUser.created_at)
    console.log('   Provider:', authUser.app_metadata.provider || 'N/A')
    console.log('   Last sign in:', authUser.last_sign_in_at || '(never)')
  } else {
    console.log('❌ AUTH.USERS: Not found')
  }
  console.log('')
  
  if (!authUser) {
    console.log('')
    continue
  }
  
  const userId = authUser.id
  
  // 2. Customer profile
  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (profile) {
    console.log('✅ CUSTOMER_PROFILES:')
    console.log('   ID:', profile.id)
    console.log('   Email:', profile.email)
    console.log('   Name:', profile.name || '(null)')
    console.log('   Created:', profile.created_at)
  } else {
    console.log('❌ CUSTOMER_PROFILES: Not found')
  }
  console.log('')
  
  // 3. Addresses
  const { data: addresses } = await supabase
    .from('customer_addresses')
    .select('id, address_line_1, city, is_default')
    .eq('user_id', userId)
  
  if (addresses && addresses.length > 0) {
    console.log(`✅ CUSTOMER_ADDRESSES: ${addresses.length} found`)
    addresses.forEach((addr, i) => {
      console.log(`   ${i+1}. ${addr.address_line_1}, ${addr.city} (default: ${addr.is_default})`)
    })
  } else {
    console.log('✅ CUSTOMER_ADDRESSES: None')
  }
  console.log('')
  
  // 4. Orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total, payment_method, created_at')
    .eq('user_id', userId)
  
  if (orders && orders.length > 0) {
    console.log(`⚠️  ORDERS: ${orders.length} found`)
    orders.forEach((order, i) => {
      console.log(`   ${i+1}. ${order.id} | ${order.status} | $${order.total} | ${order.payment_method} | ${order.created_at}`)
    })
  } else {
    console.log('✅ ORDERS: None')
  }
  console.log('')
  
  // 5. Layaways
  const { data: layaways } = await supabase
    .from('layaways')
    .select('id, status, total_price, paid_amount, created_at')
    .eq('user_id', userId)
  
  if (layaways && layaways.length > 0) {
    console.log(`⚠️  LAYAWAYS: ${layaways.length} found`)
    layaways.forEach((lay, i) => {
      console.log(`   ${i+1}. ${lay.id} | ${lay.status} | $${lay.total_price} | paid: $${lay.paid_amount} | ${lay.created_at}`)
    })
  } else {
    console.log('✅ LAYAWAYS: None')
  }
  console.log('')
  
  // 6. Payment transactions
  const { data: payments } = await supabase
    .from('payment_transactions')
    .select('id, amount, payment_type, status, created_at')
    .eq('user_id', userId)
  
  if (payments && payments.length > 0) {
    console.log(`⚠️  PAYMENT_TRANSACTIONS: ${payments.length} found`)
    payments.forEach((pay, i) => {
      console.log(`   ${i+1}. ${pay.id} | $${pay.amount} | ${pay.payment_type} | ${pay.status} | ${pay.created_at}`)
    })
  } else {
    console.log('✅ PAYMENT_TRANSACTIONS: None')
  }
  console.log('')
  
  // Summary
  const hasCriticalData = 
    (orders && orders.length > 0) || 
    (layaways && layaways.length > 0) || 
    (payments && payments.length > 0)
  
  if (hasCriticalData) {
    console.log('⛔ RESULTADO: NO BORRAR - tiene datos críticos (orders/layaways/payments)')
  } else {
    console.log('✅ RESULTADO: SEGURO BORRAR - solo tiene perfil y posiblemente direcciones')
  }
  
  console.log('')
  console.log('')
}

console.log('='.repeat(70))
console.log('FIN AUDITORÍA')
console.log('='.repeat(70))
