import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(supabaseUrl, supabaseKey)

const productId = 'd6862679-5bd9-456c-ada0-10b1f6ff50d2'

console.log('=== 1. PRODUCTO EN DB ===')
const { data: product, error: productError } = await supabase
  .from('products')
  .select('id, title, brand, model, slug, status, is_published, stock, price, currency, category, created_at, updated_at')
  .eq('id', productId)
  .single()

if (productError) {
  console.log('ERROR:', productError)
} else {
  console.log(JSON.stringify(product, null, 2))
}

console.log('\n=== 2. IMÁGENES DEL PRODUCTO ===')
const { data: images, error: imagesError } = await supabase
  .from('product_images')
  .select('id, product_id, url, alt_text, position')
  .eq('product_id', productId)
  .order('position', { ascending: true })

if (imagesError) {
  console.log('ERROR:', imagesError)
} else {
  console.log(JSON.stringify(images, null, 2))
}

console.log('\n=== 3. QUERY CATÁLOGO PARA ESTE PRODUCTO ===')
const { data: catalogProduct, error: catalogError } = await supabase
  .from('products')
  .select('*, product_images(*)')
  .eq('id', productId)
  .eq('is_published', true)

if (catalogError) {
  console.log('ERROR:', catalogError)
} else {
  console.log('Resultado:', catalogProduct ? catalogProduct.length : 0, 'productos')
  console.log(JSON.stringify(catalogProduct, null, 2))
}

console.log('\n=== 4. TODOS LOS PRODUCTOS PUBLICADOS ===')
const { data: allPublished, error: allError } = await supabase
  .from('products')
  .select('id, title, slug, status, is_published, created_at')
  .eq('is_published', true)
  .order('created_at', { ascending: false })

if (allError) {
  console.log('ERROR:', allError)
} else {
  console.log('Total publicados:', allPublished.length)
  console.log(JSON.stringify(allPublished, null, 2))
}

console.log('\n=== 5. TODOS LOS PRODUCTOS (sin filtro) ===')
const { data: allProducts, error: allProductsError } = await supabase
  .from('products')
  .select('id, title, slug, status, is_published, stock, created_at')
  .order('created_at', { ascending: false })

if (allProductsError) {
  console.log('ERROR:', allProductsError)
} else {
  console.log('Total productos:', allProducts.length)
  console.log(JSON.stringify(allProducts, null, 2))
}
