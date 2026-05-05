import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('===== COMPARACIÓN PRODUCTO NUEVO VS ANTIGUO =====\n')

const fields = `
  id, slug, title, brand, model, color, origin, status, condition,
  price, currency, category, badge, description, is_published,
  includes_box, includes_dust_bag, includes_papers, stock,
  allow_layaway, layaway_deposit_percent,
  created_at, updated_at
`

// Producto nuevo
const { data: nuevo, error: errorNuevo } = await supabase
  .from('products')
  .select(`${fields}, product_images(*)`)
  .eq('slug', 'chanel-25-small-negra-test-slug-negro')
  .single()

// Producto antiguo
const { data: antiguo, error: errorAntiguo } = await supabase
  .from('products')
  .select(`${fields}, product_images(*)`)
  .eq('slug', '25-small-negra')
  .single()

console.log('========== PRODUCTO NUEVO ==========')
console.log('ID:', nuevo.id)
console.log('Slug:', nuevo.slug)
console.log('Title:', nuevo.title)
console.log('Brand:', nuevo.brand)
console.log('Model:', nuevo.model)
console.log('Color:', nuevo.color)
console.log('Origin:', nuevo.origin)
console.log('Status:', nuevo.status)
console.log('Condition:', nuevo.condition)
console.log('Price:', nuevo.price)
console.log('Currency:', nuevo.currency)
console.log('Category:', nuevo.category)
console.log('Badge:', nuevo.badge)
console.log('Description:', nuevo.description)
console.log('Is Published:', nuevo.is_published)
console.log('Stock:', nuevo.stock)
console.log('Allow Layaway:', nuevo.allow_layaway)
console.log('Layaway Deposit %:', nuevo.layaway_deposit_percent)
console.log('Includes Box:', nuevo.includes_box)
console.log('Includes Dust Bag:', nuevo.includes_dust_bag)
console.log('Includes Papers:', nuevo.includes_papers)
console.log('Product Images Count:', nuevo.product_images?.length || 0)
console.log('Product Images Data:', JSON.stringify(nuevo.product_images, null, 2))

console.log('\n========== PRODUCTO ANTIGUO ==========')
console.log('ID:', antiguo.id)
console.log('Slug:', antiguo.slug)
console.log('Title:', antiguo.title)
console.log('Brand:', antiguo.brand)
console.log('Model:', antiguo.model)
console.log('Color:', antiguo.color)
console.log('Origin:', antiguo.origin)
console.log('Status:', antiguo.status)
console.log('Condition:', antiguo.condition)
console.log('Price:', antiguo.price)
console.log('Currency:', antiguo.currency)
console.log('Category:', antiguo.category)
console.log('Badge:', antiguo.badge)
console.log('Description:', antiguo.description)
console.log('Is Published:', antiguo.is_published)
console.log('Stock:', antiguo.stock)
console.log('Allow Layaway:', antiguo.allow_layaway)
console.log('Layaway Deposit %:', antiguo.layaway_deposit_percent)
console.log('Includes Box:', antiguo.includes_box)
console.log('Includes Dust Bag:', antiguo.includes_dust_bag)
console.log('Includes Papers:', antiguo.includes_papers)
console.log('Product Images Count:', antiguo.product_images?.length || 0)
console.log('Product Images Data:', JSON.stringify(antiguo.product_images, null, 2))

console.log('\n========== DIFERENCIAS ==========')

const campos = [
  'title', 'brand', 'model', 'color', 'origin', 'status', 'condition',
  'price', 'currency', 'category', 'badge', 'description', 'is_published',
  'stock', 'allow_layaway', 'layaway_deposit_percent',
  'includes_box', 'includes_dust_bag', 'includes_papers'
]

campos.forEach(campo => {
  const valNuevo = nuevo[campo]
  const valAntiguo = antiguo[campo]
  
  if (valNuevo !== valAntiguo) {
    console.log(`${campo}:`)
    console.log(`  Nuevo: ${JSON.stringify(valNuevo)} (${typeof valNuevo})`)
    console.log(`  Antiguo: ${JSON.stringify(valAntiguo)} (${typeof valAntiguo})`)
  }
})

const imgNuevo = nuevo.product_images?.length || 0
const imgAntiguo = antiguo.product_images?.length || 0
if (imgNuevo !== imgAntiguo) {
  console.log(`product_images count:`)
  console.log(`  Nuevo: ${imgNuevo}`)
  console.log(`  Antiguo: ${imgAntiguo}`)
}

console.log('\n========== CAMPOS NULL/UNDEFINED ==========')
console.log('Producto nuevo:')
campos.forEach(campo => {
  if (nuevo[campo] === null || nuevo[campo] === undefined) {
    console.log(`  - ${campo}: ${nuevo[campo]}`)
  }
})

console.log('\nProducto antiguo:')
campos.forEach(campo => {
  if (antiguo[campo] === null || antiguo[campo] === undefined) {
    console.log(`  - ${campo}: ${antiguo[campo]}`)
  }
})
