import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://orhjnwpbzxyqtyrayvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
)

console.log('📊 Checking migration status...\n')

// Test if user_id column exists in orders
const { data, error } = await supabase
  .from('orders')
  .select('user_id')
  .limit(1)

if (error) {
  if (error.message.includes('column "user_id" does not exist')) {
    console.log('❌ Migration 016 NOT applied: user_id column does not exist')
  } else {
    console.log('⚠️  Error checking orders.user_id:', error.message)
  }
} else {
  console.log('✅ Migration 016 APPLIED: user_id column exists')
}
