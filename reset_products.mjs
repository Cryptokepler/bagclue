import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://orhjnwpbzxyqtyrayvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
)

console.log('🔄 Liberando productos para pruebas...\n')

// Get all products
const { data: products, error } = await supabaseAdmin
  .from('products')
  .select('id, title, brand, status, stock')
  .order('created_at', { ascending: false })

if (error) {
  console.log('❌ Error:', error.message)
  process.exit(1)
}

console.log(`📊 Total productos: ${products.length}\n`)

// Group by status
const byStatus = {}
products.forEach(p => {
  if (!byStatus[p.status]) byStatus[p.status] = []
  byStatus[p.status].push(p)
})

console.log('Estado actual:')
Object.keys(byStatus).forEach(status => {
  console.log(`  - ${status}: ${byStatus[status].length}`)
})

// Change reserved/sold to available
const toUpdate = products.filter(p => p.status === 'reserved' || p.status === 'sold')

if (toUpdate.length === 0) {
  console.log('\n✅ No hay productos que liberar. Todos están disponibles.')
} else {
  console.log(`\n🔧 Liberando ${toUpdate.length} productos...\n`)
  
  for (const product of toUpdate) {
    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({ status: 'available' })
      .eq('id', product.id)
    
    if (updateError) {
      console.log(`  ❌ ${product.brand} ${product.title} - Error: ${updateError.message}`)
    } else {
      console.log(`  ✅ ${product.brand} ${product.title} - ${product.status} → available`)
    }
  }
  
  console.log(`\n✅ ${toUpdate.length} productos liberados y disponibles para pruebas`)
}
