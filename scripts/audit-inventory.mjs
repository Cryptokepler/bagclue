import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function auditInventory() {
  console.log('📋 AUDITORÍA DE INVENTARIO PRE-PRODUCCIÓN\n')
  console.log('='.repeat(80))
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, brand, model, price, status, stock, is_published, slug, created_at')
    .order('is_published', { ascending: false })
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
  
  console.log(`\nTotal productos en DB: ${products.length}`)
  
  const published = products.filter(p => p.is_published)
  const unpublished = products.filter(p => !p.is_published)
  
  console.log(`Publicados actualmente: ${published.length}`)
  console.log(`No publicados: ${unpublished.length}`)
  
  console.log('\n' + '='.repeat(80))
  console.log('PRODUCTOS PUBLICADOS ACTUALMENTE:')
  console.log('='.repeat(80))
  
  if (published.length === 0) {
    console.log('(ninguno)')
  } else {
    published.forEach(p => {
      console.log(`\n📦 ${p.brand} - ${p.title}`)
      console.log(`   ID: ${p.id}`)
      console.log(`   Modelo: ${p.model || 'N/A'}`)
      console.log(`   Precio: $${p.price.toLocaleString()} MXN`)
      console.log(`   Status: ${p.status}`)
      console.log(`   Stock: ${p.stock || 0}`)
      console.log(`   Slug: ${p.slug}`)
    })
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('PRODUCTOS NO PUBLICADOS:')
  console.log('='.repeat(80))
  
  if (unpublished.length === 0) {
    console.log('(ninguno)')
  } else {
    unpublished.forEach(p => {
      console.log(`\n📦 ${p.brand || 'N/A'} - ${p.title}`)
      console.log(`   ID: ${p.id}`)
      console.log(`   Precio: $${p.price?.toLocaleString() || 'N/A'} MXN`)
      console.log(`   Status: ${p.status}`)
      console.log(`   Slug: ${p.slug}`)
    })
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('IDENTIFICACIÓN DE PRODUCTOS PARA MANTENER PUBLICADOS:')
  console.log('='.repeat(80))
  
  // Buscar Chanel Vanity Slim
  const chanelVanity = products.find(p => 
    p.brand?.toLowerCase() === 'chanel' && 
    p.title?.toLowerCase().includes('vanity') &&
    p.title?.toLowerCase().includes('slim')
  )
  
  // Buscar Goyard St. Louis rosa
  const goyardStLouis = products.find(p => 
    p.brand?.toLowerCase() === 'goyard' && 
    p.title?.toLowerCase().includes('st') &&
    p.title?.toLowerCase().includes('louis') &&
    p.title?.toLowerCase().includes('rosa')
  )
  
  // Buscar Goyard Anjou PM
  const goyardAnjou = products.find(p => 
    p.brand?.toLowerCase() === 'goyard' && 
    p.title?.toLowerCase().includes('anjou')
  )
  
  console.log('\n1. Chanel Vanity Slim:')
  if (chanelVanity) {
    console.log(`   ✅ ENCONTRADO`)
    console.log(`   ID: ${chanelVanity.id}`)
    console.log(`   Título: ${chanelVanity.title}`)
    console.log(`   Precio: $${chanelVanity.price.toLocaleString()} MXN`)
    console.log(`   Status: ${chanelVanity.status}`)
    console.log(`   Stock: ${chanelVanity.stock || 0}`)
    console.log(`   Publicado: ${chanelVanity.is_published ? 'SÍ' : 'NO'}`)
  } else {
    console.log(`   ❌ NO ENCONTRADO`)
  }
  
  console.log('\n2. Goyard Pm St. Louis rosa edición limitada:')
  if (goyardStLouis) {
    console.log(`   ✅ ENCONTRADO`)
    console.log(`   ID: ${goyardStLouis.id}`)
    console.log(`   Título: ${goyardStLouis.title}`)
    console.log(`   Precio: $${goyardStLouis.price.toLocaleString()} MXN`)
    console.log(`   Status: ${goyardStLouis.status}`)
    console.log(`   Stock: ${goyardStLouis.stock || 0}`)
    console.log(`   Publicado: ${goyardStLouis.is_published ? 'SÍ' : 'NO'}`)
  } else {
    console.log(`   ❌ NO ENCONTRADO`)
  }
  
  console.log('\n3. Goyard Anjou PM:')
  if (goyardAnjou) {
    console.log(`   ✅ ENCONTRADO`)
    console.log(`   ID: ${goyardAnjou.id}`)
    console.log(`   Título: ${goyardAnjou.title}`)
    console.log(`   Precio: $${goyardAnjou.price.toLocaleString()} MXN`)
    console.log(`   Status: ${goyardAnjou.status}`)
    console.log(`   Stock: ${goyardAnjou.stock || 0}`)
    console.log(`   Publicado: ${goyardAnjou.is_published ? 'SÍ' : 'NO'}`)
  } else {
    console.log(`   ❌ NO ENCONTRADO`)
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('RESUMEN AUDITORÍA:')
  console.log('='.repeat(80))
  console.log(`Total productos: ${products.length}`)
  console.log(`Publicados actualmente: ${published.length}`)
  console.log(`Productos a mantener publicados: ${[chanelVanity, goyardStLouis, goyardAnjou].filter(Boolean).length}`)
  console.log(`Productos que serán despublicados: ${products.length - [chanelVanity, goyardStLouis, goyardAnjou].filter(Boolean).length}`)
  
  if (chanelVanity && goyardStLouis && goyardAnjou) {
    console.log('\n✅ Todos los productos objetivo identificados correctamente')
    console.log('\nIDs confirmados para UPDATE:')
    console.log(`- Chanel Vanity Slim: ${chanelVanity.id}`)
    console.log(`- Goyard St. Louis rosa: ${goyardStLouis.id}`)
    console.log(`- Goyard Anjou PM: ${goyardAnjou.id}`)
  } else {
    console.log('\n⚠️  ADVERTENCIA: No se encontraron todos los productos objetivo')
    console.log('   Verificar nombres/datos antes de proceder con limpieza')
  }
  
  console.log('\n' + '='.repeat(80))
}

auditInventory()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
