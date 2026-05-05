import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('===== DIAGNÓSTICO EXACTO ERROR REACT =====\n')

// Query con TODOS los campos públicos incluyendo los nuevos de MVP.1A
const allFields = `
  id, slug, title, brand, model, color, origin, status, condition,
  price, currency, category, badge, description, is_published,
  includes_box, includes_dust_bag, includes_papers, stock,
  allow_layaway, layaway_deposit_percent,
  material, condition_notes, authenticity_verified, included_accessories,
  created_at, updated_at
`

const { data: nuevo, error: e1 } = await supabase
  .from('products')
  .select(`${allFields}, product_images(*)`)
  .eq('slug', 'chanel-25-small-negra-test-slug-negro')
  .single()

const { data: viejo, error: e2 } = await supabase
  .from('products')
  .select(`${allFields}, product_images(*)`)
  .eq('slug', '25-small-negra')
  .single()

console.log('========== PRODUCTO NUEVO (CON ERROR) ==========\n')
console.log(JSON.stringify(nuevo, null, 2))

console.log('\n========== PRODUCTO VIEJO (SIN ERROR) ==========\n')
console.log(JSON.stringify(viejo, null, 2))

console.log('\n========== COMPARACIÓN CAMPO POR CAMPO ==========\n')

const campos = [
  'id', 'slug', 'title', 'brand', 'model', 'color', 'origin', 'status', 'condition',
  'price', 'currency', 'category', 'badge', 'description', 'is_published',
  'includes_box', 'includes_dust_bag', 'includes_papers', 'stock',
  'allow_layaway', 'layaway_deposit_percent',
  'material', 'condition_notes', 'authenticity_verified', 'included_accessories',
  'created_at', 'updated_at'
]

campos.forEach(campo => {
  const vNuevo = nuevo[campo]
  const vViejo = viejo[campo]
  const tNuevo = typeof vNuevo
  const tViejo = typeof vViejo
  
  if (vNuevo !== vViejo || tNuevo !== tViejo) {
    console.log(`${campo}:`)
    console.log(`  NUEVO: ${JSON.stringify(vNuevo)} (${tNuevo})`)
    console.log(`  VIEJO: ${JSON.stringify(vViejo)} (${tViejo})`)
    
    if (vNuevo === null && vViejo !== null) {
      console.log(`  ⚠️ NUEVO es NULL pero VIEJO tiene valor`)
    }
    if (vNuevo !== null && vViejo === null) {
      console.log(`  ⚠️ VIEJO es NULL pero NUEVO tiene valor`)
    }
    console.log('')
  }
})

console.log('========== PRODUCT IMAGES ==========\n')
console.log(`NUEVO images count: ${nuevo.product_images?.length || 0}`)
console.log(`VIEJO images count: ${viejo.product_images?.length || 0}`)

if (nuevo.product_images?.[0]) {
  console.log('\nNUEVO first image:')
  console.log(JSON.stringify(nuevo.product_images[0], null, 2))
}

if (viejo.product_images?.[0]) {
  console.log('\nVIEJO first image:')
  console.log(JSON.stringify(viejo.product_images[0], null, 2))
}

console.log('\n========== CAMPOS NULL EN PRODUCTO NUEVO ==========\n')
campos.forEach(campo => {
  if (nuevo[campo] === null) {
    console.log(`- ${campo}: null`)
  }
})

console.log('\n========== CAMPOS NULL EN PRODUCTO VIEJO ==========\n')
campos.forEach(campo => {
  if (viejo[campo] === null) {
    console.log(`- ${campo}: null`)
  }
})

console.log('\n========== CAMPOS UNDEFINED ==========\n')
console.log('NUEVO:')
campos.forEach(campo => {
  if (nuevo[campo] === undefined) {
    console.log(`- ${campo}: undefined`)
  }
})

console.log('\nVIEJO:')
campos.forEach(campo => {
  if (viejo[campo] === undefined) {
    console.log(`- ${campo}: undefined`)
  }
})
