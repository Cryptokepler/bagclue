import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('===== VALIDACIÓN POST-DEPLOY =====\n')

// Simular query de /catalogo/[id]/page.tsx con PRODUCT_PUBLIC_FIELDS actualizados
const PRODUCT_PUBLIC_FIELDS = `
  id,
  slug,
  title,
  brand,
  model,
  color,
  origin,
  status,
  condition,
  price,
  currency,
  category,
  badge,
  description,
  is_published,
  includes_box,
  includes_dust_bag,
  includes_papers,
  stock,
  allow_layaway,
  layaway_deposit_percent,
  created_at,
  updated_at
`.trim()

// 1. Producto nuevo
console.log('1. Producto nuevo (chanel-25-small-negra-test-slug-negro):')
const { data: newProduct, error: errorNew } = await supabase
  .from('products')
  .select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*)`)
  .eq('slug', 'chanel-25-small-negra-test-slug-negro')
  .eq('is_published', true)
  .single()

if (errorNew) {
  console.log('   ❌ FAIL - Error:', errorNew.message)
} else {
  console.log('   ✅ PASS - Query exitosa')
  console.log('   - Title:', newProduct.title)
  console.log('   - Imágenes:', newProduct.product_images?.length || 0)
}

// 2. Producto antiguo
console.log('\n2. Producto antiguo (25-small-negra):')
const { data: oldProduct, error: errorOld } = await supabase
  .from('products')
  .select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*)`)
  .eq('slug', '25-small-negra')
  .eq('is_published', true)
  .single()

if (errorOld) {
  console.log('   ❌ FAIL - Error:', errorOld.message)
} else {
  console.log('   ✅ PASS - Query exitosa')
  console.log('   - Title:', oldProduct.title)
  console.log('   - Imágenes:', oldProduct.product_images?.length || 0)
}

// 3. Lista de catálogo
console.log('\n3. Lista catálogo (todos los productos publicados):')
const { data: allProducts, error: errorAll } = await supabase
  .from('products')
  .select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*)`)
  .eq('is_published', true)
  .order('created_at', { ascending: false })

if (errorAll) {
  console.log('   ❌ FAIL - Error:', errorAll.message)
} else {
  console.log('   ✅ PASS - Query exitosa')
  console.log('   - Total productos:', allProducts.length)
}

console.log('\n===== RESUMEN =====')
console.log('Producto nuevo:', newProduct ? '✅ FUNCIONA' : '❌ FALLA')
console.log('Producto antiguo:', oldProduct ? '✅ FUNCIONA' : '❌ FALLA')
console.log('Lista catálogo:', allProducts ? '✅ FUNCIONA' : '❌ FALLA')
console.log('\nURLs para validar manualmente:')
console.log('- https://bagclue.vercel.app/catalogo/chanel-25-small-negra-test-slug-negro')
console.log('- https://bagclue.vercel.app/catalogo/25-small-negra')
console.log('- https://bagclue.vercel.app/catalogo')
