import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://orhjnwpbzxyqtyrayvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
)

console.log('🔍 Validando orden más reciente...\n')

// Get most recent order
const { data: orders, error } = await supabaseAdmin
  .from('orders')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(1)

if (error) {
  console.log('❌ Error:', error.message)
  process.exit(1)
}

if (orders.length === 0) {
  console.log('❌ No hay órdenes en la base de datos')
  process.exit(1)
}

const order = orders[0]

console.log('📋 ORDEN MÁS RECIENTE:\n')
console.log(`Order ID: ${order.id}`)
console.log(`Created: ${new Date(order.created_at).toLocaleString('es-MX')}`)
console.log(`Customer Name: ${order.customer_name}`)
console.log(`Customer Email: ${order.customer_email}`)
console.log(`User ID: ${order.user_id || 'NULL'}`)
console.log(`Total: $${order.total} MXN`)
console.log(`Status: ${order.status}`)
console.log(`Payment: ${order.payment_status}`)
console.log(`Tracking Token: ${order.tracking_token ? 'Yes' : 'No'}`)
console.log('')

// Validate
const issues = []

if (!order.user_id) {
  issues.push('❌ user_id está NULL (debería tener valor)')
}

if (order.customer_email !== 'jhonatanvenegas@usdtcapital.es') {
  issues.push(`❌ customer_email es ${order.customer_email} (debería ser jhonatanvenegas@usdtcapital.es)`)
}

if (issues.length > 0) {
  console.log('⚠️  PROBLEMAS DETECTADOS:\n')
  issues.forEach(issue => console.log(`  ${issue}`))
  console.log('')
} else {
  console.log('✅ ORDEN CORRECTA:\n')
  console.log(`  ✅ user_id: ${order.user_id}`)
  console.log(`  ✅ customer_email: ${order.customer_email}`)
  console.log('')
}

// Check if it would appear in /account/orders
console.log('🔒 Verificación RLS:\n')

const expectedUserId = '9b37d6cc-0b45-4a39-8226-d3022606fcd8'

if (order.user_id === expectedUserId) {
  console.log('  ✅ user_id coincide - orden APARECERÁ por user_id match')
} else if (order.customer_email === 'jhonatanvenegas@usdtcapital.es') {
  console.log('  ✅ customer_email coincide - orden APARECERÁ por email fallback')
} else {
  console.log('  ❌ Ni user_id ni email coinciden - orden NO APARECERÁ')
}
