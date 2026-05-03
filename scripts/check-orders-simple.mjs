// Simple check for orders related to test layaway
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const testUserId = '9b37d6cc-0b45-4a39-8226-d3022606fcd8'
const testEmail = 'jhonatanvenegas@usdtcapital.es'

console.log('Checking for orders created today...\n')

// Get all orders from today for test user
const today = new Date().toISOString().split('T')[0]

const { data: orders, error } = await supabase
  .from('orders')
  .select('id, status, total_amount, created_at, user_id, customer_email')
  .eq('user_id', testUserId)
  .gte('created_at', today)

if (error) {
  console.log('❌ Error:', error.message)
} else if (orders && orders.length > 0) {
  console.log('⚠️ Encontradas', orders.length, 'order(s) del usuario test creadas hoy:')
  console.log(JSON.stringify(orders, null, 2))
  console.log('\n❌ FAIL - Se crearon orders (no debería haber ninguna)')
} else {
  console.log('✅ PASS - No se crearon orders hoy para el usuario test')
}
