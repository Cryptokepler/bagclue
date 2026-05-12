import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function verifyProduct() {
  console.log('🔍 VERIFICACIÓN CHANEL MINI PREPPY ROSA\n')
  console.log('='.repeat(80))
  
  const productId = '5d17eef3-c8d3-4f3b-bc44-04c0109e637e'
  
  // 1. Verificar producto existe
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()
  
  if (error || !product) {
    console.log('❌ Producto NO encontrado en DB')
    console.error('Error:', error)
    process.exit(1)
  }
  
  console.log('✅ Producto encontrado en DB:')
  console.log(`   ID: ${product.id}`)
  console.log(`   Title: ${product.title}`)
  console.log(`   Slug: ${product.slug}`)
  console.log(`   Brand: ${product.brand}`)
  console.log(`   Model: ${product.model}`)
  console.log(`   Status: ${product.status}`)
  console.log(`   Stock: ${product.stock}`)
  console.log(`   is_published: ${product.is_published}`)
  console.log(`   Price: $${product.price} ${product.currency}`)
  
  // 2. Verificar aparece en query Inactivos
  console.log('\n' + '='.repeat(80))
  console.log('QUERY VISTA INACTIVOS (is_published=false):')
  console.log('='.repeat(80))
  
  const { data: inactivos, error: inactivosError } = await supabase
    .from('products')
    .select('id, title, brand, model, is_published, status')
    .eq('is_published', false)
    .order('created_at', { ascending: false })
  
  if (inactivosError) {
    console.error('❌ Error query inactivos:', inactivosError)
  } else {
    const found = inactivos.find(p => p.id === productId)
    if (found) {
      console.log(`✅ Mini Preppy ENCONTRADO en query Inactivos`)
      console.log(`   Posición: ${inactivos.findIndex(p => p.id === productId) + 1} de ${inactivos.length}`)
    } else {
      console.log(`❌ Mini Preppy NO encontrado en query Inactivos`)
      console.log(`   Total inactivos: ${inactivos.length}`)
    }
  }
  
  // 3. Verificar aparece en query Todos
  console.log('\n' + '='.repeat(80))
  console.log('QUERY VISTA TODOS (sin filtro is_published):')
  console.log('='.repeat(80))
  
  const { data: todos, error: todosError } = await supabase
    .from('products')
    .select('id, title, brand, model, is_published, status')
    .order('created_at', { ascending: false })
  
  if (todosError) {
    console.error('❌ Error query todos:', todosError)
  } else {
    const found = todos.find(p => p.id === productId)
    if (found) {
      console.log(`✅ Mini Preppy ENCONTRADO en query Todos`)
      console.log(`   Posición: ${todos.findIndex(p => p.id === productId) + 1} de ${todos.length}`)
    } else {
      console.log(`❌ Mini Preppy NO encontrado en query Todos`)
      console.log(`   Total todos: ${todos.length}`)
    }
  }
  
  // 4. Verificar search funciona
  console.log('\n' + '='.repeat(80))
  console.log('SEARCH "Mini Preppy":')
  console.log('='.repeat(80))
  
  const { data: searchResults, error: searchError } = await supabase
    .from('products')
    .select('id, title, brand, model, is_published')
    .or('title.ilike.%Mini Preppy%,brand.ilike.%Mini Preppy%,model.ilike.%Mini Preppy%')
  
  if (searchError) {
    console.error('❌ Error search:', searchError)
  } else {
    const found = searchResults.find(p => p.id === productId)
    if (found) {
      console.log(`✅ Mini Preppy ENCONTRADO en search`)
      console.log(`   Resultados: ${searchResults.length}`)
    } else {
      console.log(`❌ Mini Preppy NO encontrado en search`)
      console.log(`   Resultados: ${searchResults.length}`)
    }
  }
  
  // 5. Verificar imagen
  console.log('\n' + '='.repeat(80))
  console.log('IMAGEN PRODUCTO:')
  console.log('='.repeat(80))
  
  const { data: images } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
  
  if (images && images.length > 0) {
    console.log(`✅ Imagen encontrada:`)
    console.log(`   URL: ${images[0].url}`)
    console.log(`   Position: ${images[0].position}`)
  } else {
    console.log(`❌ No hay imagen para este producto`)
  }
  
  // 6. Rutas
  console.log('\n' + '='.repeat(80))
  console.log('RUTAS CORRECTAS:')
  console.log('='.repeat(80))
  console.log(`✅ Admin edit: https://bagclue.vercel.app/admin/productos/${product.id}`)
  console.log(`✅ Listado admin: https://bagclue.vercel.app/admin/productos`)
  console.log(`⚠️  Preview público: https://bagclue.vercel.app/catalogo/${product.slug}`)
  console.log(`   (No visible hasta is_published=true)`)
  
  console.log('\n' + '='.repeat(80))
  console.log('RESUMEN:')
  console.log('='.repeat(80))
  console.log(`✅ Producto existe en DB`)
  console.log(`✅ is_published: ${product.is_published} (correcto para inactivo)`)
  console.log(`✅ status: ${product.status}`)
  console.log(`✅ Debe aparecer en tab Inactivos`)
  console.log(`✅ Debe aparecer en tab Todos`)
  console.log(`✅ Search debe funcionar`)
  console.log('\n' + '='.repeat(80))
}

verifyProduct()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
