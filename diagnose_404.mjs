import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('===== DIAGNÓSTICO 404 PRODUCTO =====\n')

// 1. Query por ID
console.log('1. DB por id:')
const { data: byId, error: errorId } = await supabase
  .from('products')
  .select('id, title, brand, model, color, slug, status, is_published, stock, created_at')
  .eq('id', 'ce6f91c8-f57c-456a-871c-b8b6b746ae4f')
  .single()

if (errorId) {
  console.log('   NO ENCONTRADO - Error:', errorId.message)
} else {
  console.log('   ENCONTRADO')
  console.log('   - ID:', byId.id)
  console.log('   - Title:', byId.title)
  console.log('   - Slug:', byId.slug)
  console.log('   - Status:', byId.status)
  console.log('   - Is Published:', byId.is_published)
  console.log('   - Stock:', byId.stock)
  console.log('   - Created:', byId.created_at)
}

// 2. Query por slug
console.log('\n2. DB por slug:')
const { data: bySlug, error: errorSlug } = await supabase
  .from('products')
  .select('id, title, brand, model, color, slug, status, is_published, stock, created_at')
  .eq('slug', 'chanel-25-small-negra-test-slug-negro')
  .single()

if (errorSlug) {
  console.log('   NO ENCONTRADO - Error:', errorSlug.message)
} else {
  console.log('   ENCONTRADO')
  console.log('   - ID:', bySlug.id)
  console.log('   - Slug:', bySlug.slug)
  console.log('   - Status:', bySlug.status)
  console.log('   - Is Published:', bySlug.is_published)
  console.log('   - Stock:', bySlug.stock)
}

// 3. Query exacta de la página (con PRODUCT_PUBLIC_FIELDS simulado)
console.log('\n3. Query de la página (/catalogo/[id]/page.tsx):')
const { data: pageQuery, error: errorPage } = await supabase
  .from('products')
  .select(`
    id, slug, title, brand, model, color, origin, status, condition,
    price, currency, category, badge, description, is_published,
    includes_box, includes_dust_bag, includes_papers, stock,
    allow_layaway, layaway_deposit_percent, layaway_min_percent,
    layaway_duration_days, created_at, updated_at,
    product_images(*)
  `)
  .eq('slug', 'chanel-25-small-negra-test-slug-negro')
  .eq('is_published', true)
  .single()

if (errorPage) {
  console.log('   FALLÓ - Error:', errorPage.message)
  console.log('   Code:', errorPage.code)
  console.log('   Details:', errorPage.details)
} else {
  console.log('   EXITOSA')
  console.log('   - Producto:', pageQuery.title)
  console.log('   - Imágenes:', pageQuery.product_images?.length || 0)
}

// 4. Producto antiguo
console.log('\n4. Producto antiguo (25-small-negra):')
const { data: oldProduct, error: errorOld } = await supabase
  .from('products')
  .select('id, slug, title, status, is_published')
  .eq('slug', '25-small-negra')
  .single()

if (errorOld) {
  console.log('   NO ENCONTRADO - Error:', errorOld.message)
} else {
  console.log('   ENCONTRADO')
  console.log('   - Slug:', oldProduct.slug)
  console.log('   - Title:', oldProduct.title)
  console.log('   - Is Published:', oldProduct.is_published)
}

// Resumen
console.log('\n===== RESUMEN =====')
console.log('DB por id:', byId ? '✅ encontrado' : '❌ no encontrado')
console.log('DB por slug:', bySlug ? '✅ encontrado' : '❌ no encontrado')
console.log('Status:', byId?.status || 'N/A')
console.log('Is Published:', byId?.is_published || 'N/A')
console.log('Stock:', byId?.stock || 'N/A')
console.log('Query de la página:', pageQuery ? '✅ exitosa' : '❌ falló')
console.log('Producto antiguo 25-small-negra:', oldProduct ? '✅ funciona' : '❌ 404')
