import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://orhjnwpbzxyqtyrayvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
)

console.log('🔍 Validando orden de prueba de Jhonatan...\n')

// Get most recent order
const { data: orders, error } = await supabaseAdmin
  .from('orders')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(3)

if (error) {
  console.log('❌ Error:', error.message)
  process.exit(1)
}

console.log('📋 Últimas 3 órdenes:\n')

orders.forEach((order, idx) => {
  console.log(`${idx + 1}. Order ID: ${order.id}`)
  console.log(`   Email: ${order.customer_email}`)
  console.log(`   User ID: ${order.user_id || 'NULL'}`)
  console.log(`   Nombre: ${order.customer_name}`)
  console.log(`   Total: $${order.total} MXN`)
  console.log(`   Status: ${order.status}`)
  console.log(`   Payment: ${order.payment_status}`)
  console.log(`   Tracking token: ${order.tracking_token ? 'Yes' : 'No'}`)
  console.log(`   Created: ${new Date(order.created_at).toLocaleString('es-MX')}`)
  console.log('')
})

// Check customer_profiles
const { data: profiles } = await supabaseAdmin
  .from('customer_profiles')
  .select('user_id, email, name, phone')

console.log('👤 Customer profiles:\n')
profiles.forEach(p => {
  console.log(`- Email: ${p.email}`)
  console.log(`  User ID: ${p.user_id}`)
  console.log(`  Name: ${p.name || 'NULL'}`)
  console.log(`  Phone: ${p.phone || 'NULL'}`)
  console.log('')
})

// Test if RLS would show the order
const mostRecentOrder = orders[0]

console.log('🔒 Testing RLS filter simulation...')
console.log(`   Most recent order email: ${mostRecentOrder.customer_email}`)
console.log(`   Most recent order user_id: ${mostRecentOrder.user_id || 'NULL'}`)

const matchingProfile = profiles.find(p => p.email === mostRecentOrder.customer_email)

if (matchingProfile) {
  console.log(`   ✅ Email match found in customer_profiles`)
  console.log(`   → Order WILL appear in /account/orders via email fallback`)
  
  if (mostRecentOrder.user_id === matchingProfile.user_id) {
    console.log(`   ✅ user_id also matches - direct link`)
  } else {
    console.log(`   ⚠️  user_id doesn't match, but email fallback will work`)
  }
} else {
  console.log(`   ⚠️  No profile found with email ${mostRecentOrder.customer_email}`)
  console.log(`   → Order will NOT appear in /account/orders`)
  console.log(`   → This is expected if checkout was done with different email`)
}

console.log('\n✅ Validation complete')
