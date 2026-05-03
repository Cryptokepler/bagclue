// Check available products in Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(supabaseUrl, supabaseKey)

// Get available products with correct column names
const { data: products, error } = await supabase
  .from('products')
  .select('id, title, brand, price, stock, is_published, allow_layaway')
  .eq('is_published', true)
  .gte('stock', 1)
  .order('created_at', { ascending: false })
  .limit(5)

if (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}

console.log('✅ Available products (stock >= 1, is_published = true):')
console.log(JSON.stringify(products, null, 2))

if (products && products.length === 0) {
  console.log('\n⚠️ WARNING: No products available with stock >= 1')
  console.log('Need to update stock for testing')
}
