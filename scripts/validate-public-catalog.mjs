import { createClient } from '@supabase/supabase-js'
import https from 'https'

const SUPABASE_URL = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          html: data
        })
      })
    }).on('error', (err) => {
      resolve({ status: 0, error: err.message })
    })
  })
}

async function validatePublicCatalog() {
  console.log('🔍 VALIDACIÓN PÚBLICA CATÁLOGO BAGCLUE\n')
  console.log('='.repeat(80))
  
  // 1. Validar productos publicados en DB
  const { data: publicProducts, error } = await supabase
    .from('products')
    .select('id, title, brand, model, price, status, stock, slug')
    .eq('is_published', true)
    .eq('status', 'available')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Error DB:', error)
    process.exit(1)
  }
  
  console.log(`\n📊 Productos publicados en DB: ${publicProducts.length}`)
  
  const expected = [
    'chanel-vanity-slim-beige',
    'goyard-pm-st-louis-rosa-edicion-limitada',
    'goyard-anjou-pm-vino'
  ]
  
  const expectedCount = 3
  const actualCount = publicProducts.length
  
  console.log(`   Esperado: ${expectedCount}`)
  console.log(`   Actual: ${actualCount}`)
  console.log(`   Match: ${actualCount === expectedCount ? '✅ SÍ' : '❌ NO'}`)
  
  // Check for test/QA products
  const hasTestProducts = publicProducts.some(p => 
    p.title?.toLowerCase().includes('test') ||
    p.title?.toLowerCase().includes('qa') ||
    p.brand?.toLowerCase() === 'test brand' ||
    p.brand?.toLowerCase() === 'test'
  )
  
  console.log(`\n🚫 Productos test/QA visibles: ${hasTestProducts ? '❌ SÍ (problema)' : '✅ NO'}`)
  
  // 2. Validar fichas individuales
  console.log('\n' + '='.repeat(80))
  console.log('VALIDACIÓN FICHAS INDIVIDUALES:')
  console.log('='.repeat(80))
  
  const products = [
    {
      name: 'Chanel Vanity Slim Beige',
      slug: 'chanel-vanity-slim-beige',
      expectedPrice: '83,000',
      id: 'b1bb9a7a-d0cf-4041-9e94-bb79ce58b072'
    },
    {
      name: 'Goyard Pm St. Louis rosa',
      slug: 'goyard-pm-st-louis-rosa-edicion-limitada',
      expectedPrice: '89,900',
      id: '28f4c7c4-deb8-423e-b6a0-900ee399b85a'
    },
    {
      name: 'Goyard Anjou PM Vino',
      slug: 'goyard-anjou-pm-vino',
      expectedPrice: '63,000',
      id: 'cc573dde-815c-4e80-b68e-659609605743'
    }
  ]
  
  for (const product of products) {
    console.log(`\n📦 ${product.name}`)
    console.log(`   URL: https://bagclue.vercel.app/catalogo/${product.slug}`)
    
    const result = await checkUrl(`https://bagclue.vercel.app/catalogo/${product.slug}`)
    
    if (result.status === 200) {
      console.log(`   ✅ Status: 200 OK`)
      
      // Check for key elements in HTML
      const html = result.html
      const hasPrice = html.includes(product.expectedPrice) || html.includes(`$${product.expectedPrice}`)
      const hasImage = html.includes('product-images') || html.includes('img')
      const hasAddToCart = html.includes('Agregar al carrito') || html.includes('Comprar') || html.includes('cart')
      
      console.log(`   ${hasPrice ? '✅' : '⚠️ '} Precio visible: ${hasPrice ? 'SÍ' : 'NO'}`)
      console.log(`   ${hasImage ? '✅' : '⚠️ '} Imagen presente: ${hasImage ? 'SÍ' : 'NO'}`)
      console.log(`   ${hasAddToCart ? '✅' : '⚠️ '} Botón compra: ${hasAddToCart ? 'SÍ' : 'NO'}`)
    } else if (result.status === 0) {
      console.log(`   ❌ Error conexión: ${result.error}`)
    } else {
      console.log(`   ❌ Status: ${result.status}`)
    }
    
    // Get product details from DB
    const { data: dbProduct } = await supabase
      .from('products')
      .select('id, price, status, stock')
      .eq('id', product.id)
      .single()
    
    if (dbProduct) {
      console.log(`   📋 DB Status: ${dbProduct.status}`)
      console.log(`   📋 DB Stock: ${dbProduct.stock}`)
      console.log(`   📋 DB Price: $${dbProduct.price.toLocaleString()} MXN`)
    }
  }
  
  // 3. Validar home page
  console.log('\n' + '='.repeat(80))
  console.log('VALIDACIÓN HOME PAGE:')
  console.log('='.repeat(80))
  
  console.log('\n🏠 https://bagclue.vercel.app/')
  const homeResult = await checkUrl('https://bagclue.vercel.app/')
  
  if (homeResult.status === 200) {
    console.log('   ✅ Status: 200 OK')
    
    const html = homeResult.html
    const hasTestKeywords = html.toLowerCase().includes('qa ') || 
                           html.toLowerCase().includes('test product') ||
                           html.toLowerCase().includes('test brand')
    
    console.log(`   ${!hasTestKeywords ? '✅' : '❌'} Productos test/QA visibles: ${!hasTestKeywords ? 'NO' : 'SÍ'}`)
  } else {
    console.log(`   ❌ Status: ${homeResult.status}`)
  }
  
  // 4. Validar catálogo page
  console.log('\n' + '='.repeat(80))
  console.log('VALIDACIÓN CATÁLOGO PAGE:')
  console.log('='.repeat(80))
  
  console.log('\n📚 https://bagclue.vercel.app/catalogo')
  const catalogResult = await checkUrl('https://bagclue.vercel.app/catalogo')
  
  if (catalogResult.status === 200) {
    console.log('   ✅ Status: 200 OK')
    
    const html = catalogResult.html
    const hasTestKeywords = html.toLowerCase().includes('qa ') || 
                           html.toLowerCase().includes('test product') ||
                           html.toLowerCase().includes('test brand')
    
    console.log(`   ${!hasTestKeywords ? '✅' : '❌'} Productos test/QA visibles: ${!hasTestKeywords ? 'NO' : 'SÍ'}`)
  } else {
    console.log(`   ❌ Status: ${catalogResult.status}`)
  }
  
  // Final summary
  console.log('\n' + '='.repeat(80))
  console.log('RESUMEN VALIDACIÓN:')
  console.log('='.repeat(80))
  
  const allChecks = [
    { name: 'Productos publicados DB', pass: actualCount === expectedCount },
    { name: 'Sin productos test/QA', pass: !hasTestProducts },
    { name: 'Home page accesible', pass: homeResult.status === 200 },
    { name: 'Catálogo accesible', pass: catalogResult.status === 200 }
  ]
  
  const passCount = allChecks.filter(c => c.pass).length
  const totalChecks = allChecks.length
  
  console.log(`\n✅ Checks pasados: ${passCount}/${totalChecks}`)
  
  allChecks.forEach(check => {
    console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`)
  })
  
  if (passCount === totalChecks) {
    console.log('\n🎉 INVENTORY PRE-LIVE CLEANUP: PASS ✅')
  } else {
    console.log('\n⚠️  INVENTORY PRE-LIVE CLEANUP: FAIL')
  }
  
  console.log('\n' + '='.repeat(80))
}

validatePublicCatalog()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
