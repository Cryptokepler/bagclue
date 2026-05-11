/**
 * CORRECTED Product Audit
 * Check actual schema for publication field
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load .env.local
const envFile = readFileSync('.env.local', 'utf-8')
const envVars = {}
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

console.log('========================================')
console.log('BAGCLUE PRODUCTS - CORRECTED AUDIT')
console.log('========================================\n')

async function reauditProducts() {
  // Get ALL products with ALL fields to identify correct schema
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Query failed:', error.message)
    return
  }
  
  console.log(`Total products in DB: ${products.length}\n`)
  
  // Check schema
  if (products.length > 0) {
    const fields = Object.keys(products[0])
    console.log('Schema fields detected:')
    console.log(fields.join(', '))
    console.log('')
    
    // Identify publication field
    const pubField = fields.find(f => f.includes('publish') || f.includes('visible') || f.includes('active'))
    console.log(`Publication field: ${pubField || 'NOT FOUND'}\n`)
  }
  
  // Categorize products
  const testProducts = []
  const realProducts = []
  
  const testKeywords = ['test', 'qa', 'mvp', 'demo', 'placeholder', 'prueba', 'ejemplo']
  
  products.forEach(product => {
    const titleLower = (product.title || '').toLowerCase()
    const descLower = (product.description || '').toLowerCase()
    const modelLower = (product.model || '').toLowerCase()
    const slugLower = (product.slug || '').toLowerCase()
    
    const isTest = testKeywords.some(keyword => 
      titleLower.includes(keyword) || 
      descLower.includes(keyword) || 
      modelLower.includes(keyword) ||
      slugLower.includes(keyword)
    )
    
    if (isTest) {
      testProducts.push(product)
    } else {
      realProducts.push(product)
    }
  })
  
  // Report real products with correct publication status
  console.log('========================================')
  console.log('REAL PRODUCTS')
  console.log('========================================\n')
  
  const publishedReal = realProducts.filter(p => 
    p.published === true || p.is_published === true || p.status === 'published'
  )
  
  const availableReal = publishedReal.filter(p => 
    p.status === 'available' && (p.stock === null || p.stock > 0)
  )
  
  console.log(`Total real products: ${realProducts.length}`)
  console.log(`Published real products: ${publishedReal.length}`)
  console.log(`Available for sale: ${availableReal.length}\n`)
  
  realProducts.forEach((p, i) => {
    const isPub = p.published || p.is_published || false
    const hasImages = p.images && p.images.length > 0
    const imageCount = p.images ? p.images.length : 0
    
    console.log(`${i + 1}. ${p.title} ${isPub ? '✅ PUB' : '❌ UNPUB'}`)
    console.log(`   - ID: ${p.id}`)
    console.log(`   - Brand: ${p.brand || 'NULL'}`)
    console.log(`   - Model: ${p.model || 'NULL'}`)
    console.log(`   - Slug: ${p.slug || 'NULL'}`)
    console.log(`   - Price: $${p.price} ${p.currency}`)
    console.log(`   - Status: ${p.status}`)
    console.log(`   - Stock: ${p.stock}`)
    console.log(`   - Published field: ${p.published !== undefined ? p.published : 'N/A'}`)
    console.log(`   - is_published field: ${p.is_published !== undefined ? p.is_published : 'N/A'}`)
    console.log(`   - Images: ${imageCount}`)
    console.log(`   - Created: ${p.created_at}`)
    console.log('')
  })
  
  // Summary
  console.log('========================================')
  console.log('SUMMARY')
  console.log('========================================\n')
  
  console.log(`Test products: ${testProducts.length}`)
  console.log(`Test products published: ${testProducts.filter(p => p.published || p.is_published).length}`)
  console.log('')
  console.log(`Real products: ${realProducts.length}`)
  console.log(`Real products published: ${publishedReal.length}`)
  console.log(`Real products with images: ${realProducts.filter(p => p.images && p.images.length > 0).length}`)
  console.log(`Available for sale (published + available + stock>0): ${availableReal.length}`)
  console.log('')
  
  if (publishedReal.length > 0) {
    console.log('✅ Published real products found:\n')
    publishedReal.forEach(p => {
      console.log(`   - ${p.title} (${p.brand}) — $${p.price} ${p.currency}`)
      console.log(`     Images: ${p.images?.length || 0}`)
      console.log(`     Status: ${p.status}`)
      console.log(`     Stock: ${p.stock}`)
      console.log(`     URL: https://bagclue.vercel.app/catalogo/${p.slug}`)
      console.log('')
    })
  }
}

reauditProducts()
