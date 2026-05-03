// Minimal check for orders
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const testUserId = '9b37d6cc-0b45-4a39-8226-d3022606fcd8'

console.log('Checking for orders created today...\n')

const today = new Date().toISOString().split('T')[0]

const { data: orders, error } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', testUserId)
  .gte('created_at', today)

if (error) {
  console.log('❌ Error:', error.message)
} else {
  console.log(`Found ${orders?.length || 0} order(s) created today for test user`)
  
  if (orders && orders.length > 0) {
    console.log('\n⚠️ Orders found:')
    console.log(JSON.stringify(orders, null, 2))
    console.log('\n❌ FAIL - Orders were created (should be 0)')
  } else {
    console.log('✅ PASS - No orders created today')
  }
}
