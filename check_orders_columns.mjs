import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://orhjnwpbzxyqtyrayvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
)

console.log('🔍 Checking orders table structure...\n')

const { data, error } = await supabaseAdmin
  .from('orders')
  .select('*')
  .limit(1)

if (error) {
  console.log('❌ Error:', error.message)
} else {
  console.log('✅ Orders table columns:')
  if (data && data.length > 0) {
    Object.keys(data[0]).forEach(col => {
      console.log(`  - ${col}`)
    })
  }
}
