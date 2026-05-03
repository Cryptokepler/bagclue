import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://orhjnwpbzxyqtyrayvoi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
)

console.log('🔍 Verificando productos completos...\n')

const { data: products, error } = await supabaseAdmin
  .from('products')
  .select('id, title, brand, status, stock, is_published, price')
  .order('created_at', { ascending: false })

if (error) {
  console.log('❌ Error:', error.message)
  process.exit(1)
}

console.log('📊 Estado de productos:\n')

products.forEach(p => {
  const issues = []
  if (!p.is_published) issues.push('NO PUBLICADO')
  if (p.status !== 'available') issues.push(`STATUS: ${p.status}`)
  if (p.stock <= 0) issues.push('SIN STOCK')
  if (!p.price) issues.push('SIN PRECIO')
  
  const status = issues.length > 0 ? `❌ ${issues.join(', ')}` : '✅ OK'
  
  console.log(`${p.brand} ${p.title}`)
  console.log(`  ID: ${p.id.slice(0, 8)}`)
  console.log(`  Status: ${p.status}`)
  console.log(`  Stock: ${p.stock}`)
  console.log(`  Published: ${p.is_published}`)
  console.log(`  Price: $${p.price}`)
  console.log(`  → ${status}`)
  console.log('')
})

// Fix issues
const toFix = products.filter(p => !p.is_published || p.stock <= 0 || p.status !== 'available')

if (toFix.length > 0) {
  console.log(`\n🔧 Corrigiendo ${toFix.length} productos...\n`)
  
  for (const product of toFix) {
    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({ 
        status: 'available',
        stock: Math.max(product.stock, 1),
        is_published: true
      })
      .eq('id', product.id)
    
    if (updateError) {
      console.log(`  ❌ Error: ${updateError.message}`)
    } else {
      console.log(`  ✅ ${product.brand} ${product.title} corregido`)
    }
  }
  
  console.log('\n✅ Productos listos para agregar al carrito')
} else {
  console.log('✅ Todos los productos están listos')
}
