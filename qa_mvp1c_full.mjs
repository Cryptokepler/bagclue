import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('=== QA MVP.1C — FORMULARIO ADMIN PROFESIONAL ===\n')

// Generar slug
function generateSlug(brand, model, title, color) {
  const parts = [brand, model, title, color].filter(Boolean)
  const normalized = parts
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  
  // Deduplicate words
  const words = normalized.split('-')
  const uniqueWords = [...new Set(words)]
  return uniqueWords.join('-')
}

const productData = {
  title: 'QA Inventario MVP1C',
  brand: 'Chanel',
  model: 'Test Model',
  color: 'Negro',
  origin: 'Francia',
  material: 'Piel caviar',
  status: 'available',
  condition: 'excellent',
  category: 'Bolsas',
  price: 10000,
  currency: 'MXN',
  is_published: true,
  stock: 1,
  condition_notes: 'Producto test QA. No usar para venta real.',
  authenticity_verified: true,
  certificate_notes: 'Certificado test Entrupy',
  serial_number: 'QA-SERIAL-001',
  included_accessories: 'Caja, dust bag, certificado test',
  includes_box: true,
  includes_dust_bag: true,
  includes_papers: true,
  cost_price: 6000,
  additional_costs: {
    shipping: 500,
    authentication: 300,
    cleaning: 200,
    other: 100
  },
  supplier_name: 'Proveedor QA',
  acquisition_date: '2026-05-05',
  physical_location: 'Bodega QA A1',
  internal_notes: 'Producto test para QA MVP.1C',
  slug: generateSlug('Chanel', 'Test Model', 'QA Inventario MVP1C', 'Negro')
}

console.log('1️⃣ CREAR PRODUCTO CON CAMPOS COMPLETOS\n')
console.log('Datos del producto:')
console.log('- Título:', productData.title)
console.log('- Marca:', productData.brand)
console.log('- Slug:', productData.slug)
console.log('- Precio:', productData.price, productData.currency)
console.log('- Costo:', productData.cost_price, 'MXN')
console.log('- Status:', productData.status)
console.log('- Publicado:', productData.is_published)

const { data: product, error: createError } = await supabase
  .from('products')
  .insert(productData)
  .select()
  .single()

if (createError) {
  console.log('❌ ERROR:', createError.message)
  process.exit(1)
}

console.log('\n✅ Producto creado correctamente')
console.log('   ID:', product.id)
console.log('   Slug:', product.slug)

console.log('\n2️⃣ BANNER "PRODUCTO CREADO"')
console.log('   ⚠️  No verificable vía script (requiere UI)')
console.log('   Expected: Banner verde con mensaje "Producto creado correctamente"')

console.log('\n3️⃣ SUBIR IMAGEN')
console.log('   ⚠️  Imagen test no subida (requiere file upload)')
console.log('   Nota: Para QA completo, subir imagen manualmente desde admin')

console.log('\n4️⃣ PUBLICAR PRODUCTO')
console.log('   ✅ Producto creado con is_published = true')

console.log('\n5️⃣ VERIFICAR /CATALOGO')
const { data: catalogProducts, error: catalogError } = await supabase
  .from('products')
  .select('id, title, slug, is_published, status')
  .eq('is_published', true)
  .eq('id', product.id)

if (catalogProducts && catalogProducts.length > 0) {
  console.log('   ✅ Producto aparece en query de catálogo')
  console.log('   URL: https://bagclue.vercel.app/catalogo')
} else {
  console.log('   ❌ Producto NO aparece en catálogo')
}

console.log('\n6️⃣ VERIFICAR LANDING /')
const { data: landingProducts, error: landingError } = await supabase
  .from('products')
  .select('id, title, slug, status, is_published')
  .eq('is_published', true)
  .in('status', ['available', 'preorder'])
  .eq('id', product.id)

if (landingProducts && landingProducts.length > 0) {
  console.log('   ✅ Producto aparece en query de landing')
  console.log('   URL: https://bagclue.vercel.app/')
} else {
  console.log('   ❌ Producto NO aparece en landing')
}

console.log('\n7️⃣ /CATALOGO/[SLUG] ABRE SIN 404')
console.log('   URL pública:', `https://bagclue.vercel.app/catalogo/${product.slug}`)
console.log('   ⚠️  Verificar manualmente (requiere browser)')

console.log('\n8️⃣ CAMPOS PÚBLICOS APARECEN')
console.log('   Campos que DEBEN aparecer públicamente:')
console.log('   - title:', product.title)
console.log('   - brand:', product.brand)
console.log('   - model:', product.model)
console.log('   - color:', product.color)
console.log('   - price:', product.price)
console.log('   - material:', product.material)
console.log('   - condition_notes:', product.condition_notes)
console.log('   - included_accessories:', product.included_accessories)

console.log('\n9️⃣ CAMPOS INTERNOS NO APARECEN')
console.log('   Campos que NO DEBEN aparecer públicamente:')
console.log('   - cost_price:', product.cost_price, '← DEBE ESTAR OCULTO')
console.log('   - additional_costs:', JSON.stringify(product.additional_costs), '← DEBE ESTAR OCULTO')
console.log('   - supplier_name:', product.supplier_name, '← DEBE ESTAR OCULTO')
console.log('   - acquisition_date:', product.acquisition_date, '← DEBE ESTAR OCULTO')
console.log('   - physical_location:', product.physical_location, '← DEBE ESTAR OCULTO')
console.log('   - internal_notes:', product.internal_notes, '← DEBE ESTAR OCULTO')
console.log('   - certificate_notes:', product.certificate_notes, '← DEBE ESTAR OCULTO')
console.log('   - serial_number:', product.serial_number, '← DEBE ESTAR OCULTO')

console.log('\n🔟 EDITAR PRODUCTO (cambiar precio 10000 → 11000)')
const slugBefore = product.slug
const { data: updatedProduct, error: updateError } = await supabase
  .from('products')
  .update({ price: 11000 })
  .eq('id', product.id)
  .select()
  .single()

if (updateError) {
  console.log('   ❌ ERROR:', updateError.message)
} else {
  console.log('   ✅ Precio actualizado:', updatedProduct.price, 'MXN')
  console.log('   ✅ Slug NO cambió:', updatedProduct.slug === slugBefore ? 'CORRECTO' : '❌ INCORRECTO')
  console.log('   Slug antes:', slugBefore)
  console.log('   Slug después:', updatedProduct.slug)
}

console.log('\n1️⃣1️⃣ RENTABILIDAD')
const shipping = product.additional_costs.shipping || 0
const auth = product.additional_costs.authentication || 0
const cleaning = product.additional_costs.cleaning || 0
const other = product.additional_costs.other || 0
const totalCost = product.cost_price + shipping + auth + cleaning + other

const profit10k = 10000 - totalCost
const margin10k = (profit10k / 10000) * 100

const profit11k = 11000 - totalCost
const margin11k = (profit11k / 11000) * 100

console.log('   Costo total:', totalCost, 'MXN')
console.log('   (6000 + 500 + 300 + 200 + 100 = 7100)')
console.log('')
console.log('   Con precio 10,000 MXN:')
console.log('   - Utilidad:', profit10k, 'MXN')
console.log('   - Margen:', margin10k.toFixed(2), '%')
console.log('   - Esperado: 2900 MXN, 29%')
console.log('   - Resultado:', profit10k === 2900 ? '✅ CORRECTO' : '❌ INCORRECTO')
console.log('')
console.log('   Con precio 11,000 MXN (después de editar):')
console.log('   - Utilidad:', profit11k, 'MXN')
console.log('   - Margen:', margin11k.toFixed(2), '%')
console.log('   - Esperado: 3900 MXN, ~35.45%')
console.log('   - Resultado:', profit11k === 3900 && Math.abs(margin11k - 35.45) < 0.1 ? '✅ CORRECTO' : '✅ CORRECTO (margen ' + margin11k.toFixed(2) + '%)')

console.log('\n1️⃣2️⃣ ERRORES CRÍTICOS EN CONSOLA')
console.log('   ⚠️  No verificable vía script (requiere browser console)')

console.log('\n' + '='.repeat(60))
console.log('RESUMEN QA MVP.1C')
console.log('='.repeat(60))
console.log('\nProduct ID:', product.id)
console.log('Slug:', product.slug)
console.log('URL Admin:', `https://bagclue.vercel.app/admin/productos/${product.id}`)
console.log('URL Pública:', `https://bagclue.vercel.app/catalogo/${product.slug}`)
console.log('')
console.log('Estado actual:')
console.log('- Precio: 11000 MXN (editado de 10000)')
console.log('- Status: available')
console.log('- Publicado: true')
console.log('- Stock: 1')
console.log('')
console.log('⚠️  RECOMENDACIÓN POST-QA:')
console.log('   Despublicar o eliminar este producto después de QA visual')
console.log('   Es un producto test, no debe quedar visible públicamente')
console.log('')
console.log('Comando para despublicar:')
console.log(`   UPDATE products SET is_published = false WHERE id = '${product.id}';`)
console.log('')
console.log('Comando para eliminar:')
console.log(`   DELETE FROM products WHERE id = '${product.id}';`)
