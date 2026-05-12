import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function validateCatalog() {
  console.log('🔍 VALIDACIÓN CATÁLOGO PÚBLICO\n')
  console.log('='.repeat(80))
  
  // Query que usa el catálogo público
  const { data: publicProducts, error } = await supabase
    .from('products')
    .select('id, title, brand, model, price, status, stock, slug')
    .eq('is_published', true)
    .eq('status', 'available')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
  
  console.log(`\n✅ Productos visibles en catálogo público: ${publicProducts.length}`)
  
  if (publicProducts.length === 0) {
    console.log('\n⚠️  ADVERTENCIA: No hay productos publicados')
  } else {
    console.log('\n' + '='.repeat(80))
    console.log('PRODUCTOS EN CATÁLOGO PÚBLICO:')
    console.log('='.repeat(80))
    
    publicProducts.forEach((p, idx) => {
      console.log(`\n${idx + 1}. ${p.brand} - ${p.title}`)
      console.log(`   Precio: $${p.price.toLocaleString()} MXN`)
      console.log(`   Status: ${p.status}`)
      console.log(`   Stock: ${p.stock || 0}`)
      console.log(`   URL: https://bagclue.vercel.app/catalogo/${p.slug}`)
    })
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('VALIDACIÓN:')
  console.log('='.repeat(80))
  
  const expected = 3
  const actual = publicProducts.length
  
  if (actual === expected) {
    console.log(`✅ Catálogo muestra exactamente ${expected} productos (correcto)`)
  } else {
    console.log(`❌ Catálogo muestra ${actual} productos (esperado: ${expected})`)
  }
  
  // Verificar que son los productos correctos
  const chanelVanity = publicProducts.find(p => p.slug === 'chanel-vanity-slim-beige')
  const goyardStLouis = publicProducts.find(p => p.slug === 'goyard-pm-st-louis-rosa-edicion-limitada')
  const goyardAnjou = publicProducts.find(p => p.slug === 'goyard-anjou-pm-vino')
  
  console.log('\nProductos esperados:')
  console.log(`1. Chanel Vanity Slim: ${chanelVanity ? '✅ Presente' : '❌ Faltante'}`)
  console.log(`2. Goyard St. Louis rosa: ${goyardStLouis ? '✅ Presente' : '❌ Faltante'}`)
  console.log(`3. Goyard Anjou PM: ${goyardAnjou ? '✅ Presente' : '❌ Faltante'}`)
  
  // Verificar que no hay productos test/QA
  const hasTestProducts = publicProducts.some(p => 
    p.title.toLowerCase().includes('test') ||
    p.title.toLowerCase().includes('qa') ||
    p.brand?.toLowerCase() === 'test brand' ||
    p.brand?.toLowerCase() === 'test'
  )
  
  console.log(`\nProductos test/QA visibles: ${hasTestProducts ? '❌ SÍ (problema)' : '✅ NO (correcto)'}`)
  
  console.log('\n' + '='.repeat(80))
  console.log('ESTADO FINAL:')
  console.log('='.repeat(80))
  
  if (actual === expected && !hasTestProducts && chanelVanity && goyardStLouis && goyardAnjou) {
    console.log('✅ Catálogo limpio y listo para pre-producción')
  } else {
    console.log('⚠️  Catálogo requiere ajustes')
  }
  
  console.log('\n' + '='.repeat(80))
}

validateCatalog()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
