import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(supabaseUrl, supabaseKey)

// Query raw SQL para ver columnas de la tabla products
const { data, error } = await supabase
  .from('products')
  .select('*')
  .limit(1)
  .single()

if (error) {
  console.log('Error:', error)
} else {
  console.log('Columnas existentes en products:')
  Object.keys(data).sort().forEach(col => {
    if (col.includes('layaway') || col.includes('allow')) {
      console.log('  ✓', col, '→', typeof data[col], '→', data[col])
    }
  })
}
