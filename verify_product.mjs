import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('=== QUERY 1: Producto por ID ===\n')

const { data: byId, error: errorId } = await supabase
  .from('products')
  .select('id, title, slug, status, is_published, stock')
  .eq('id', 'ce6f91c8-f57c-456a-871c-b8b6b746ae4f')
  .single()

if (errorId) {
  console.error('Error:', errorId)
} else {
  console.log('ID:', byId.id)
  console.log('Title:', byId.title)
  console.log('Slug:', byId.slug)
  console.log('Status:', byId.status)
  console.log('Is Published:', byId.is_published)
  console.log('Stock:', byId.stock)
}

console.log('\n=== QUERY 2: Producto por Slug ===\n')

const { data: bySlug, error: errorSlug } = await supabase
  .from('products')
  .select('id, title, slug, status, is_published, stock')
  .eq('slug', 'chanel-25-small-negra-test-slug-negro')
  .single()

if (errorSlug) {
  console.error('Error:', errorSlug)
} else {
  console.log('ID:', bySlug.id)
  console.log('Title:', bySlug.title)
  console.log('Slug:', bySlug.slug)
  console.log('Status:', bySlug.status)
  console.log('Is Published:', bySlug.is_published)
  console.log('Stock:', bySlug.stock)
}

console.log('\n=== VALIDACIÓN ===\n')

if (byId && bySlug) {
  const match = byId.id === bySlug.id
  console.log('✓ Producto encontrado por ID:', byId ? '✅ SÍ' : '❌ NO')
  console.log('✓ Producto encontrado por Slug:', bySlug ? '✅ SÍ' : '❌ NO')
  console.log('✓ ID coincide entre ambas queries:', match ? '✅ SÍ' : '❌ NO')
  console.log('✓ Slug es correcto:', byId.slug === 'chanel-25-small-negra-test-slug-negro' ? '✅ SÍ' : '❌ NO')
  console.log('✓ Producto publicado:', byId.is_published ? '✅ SÍ' : '❌ NO')
  console.log('✓ Status es "available":', byId.status === 'available' ? '✅ SÍ' : '❌ NO')
}
