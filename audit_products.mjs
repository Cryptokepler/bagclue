/**
 * Audit Bagclue Products
 * Identify test products and validate real inventory
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
console.log('BAGCLUE PRODUCTS AUDIT')
console.log('========================================\n')

async function auditProducts() {
  // Get all products
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Failed to fetch products:', error.message)
    return
  }
  
  console.log(`Total products in DB: ${products.length}\n`)
  
  // Categorize products
  const testProducts = []
  const realProducts = []
  
  const testKeywords = ['test', 'qa', 'mvp', 'demo', 'placeholder', 'prueba', 'ejemplo']
  
  products.forEach(product => {
    const titleLower = (product.title || '').toLowerCase()
    const descLower = (product.description || '').toLowerCase()
    const modelLower = (product.model || '').toLowerCase()
    
    const isTest = testKeywords.some(keyword => 
      titleLower.includes(keyword) || 
      descLower.includes(keyword) || 
      modelLower.includes(keyword)
    )
    
    if (isTest) {
      testProducts.push(product)
    } else {
      realProducts.push(product)
    }
  })
  
  // Report test products
  console.log('========================================')
  console.log('TEST PRODUCTS (should be unpublished)')
  console.log('========================================\n')
  
  if (testProducts.length === 0) {
    console.log('✅ No test products detected\n')
  } else {
    console.log(`⚠️  ${testProducts.length} test product(s) detected:\n`)
    
    testProducts.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title}`)
      console.log(`   - ID: ${p.id}`)
      console.log(`   - Brand: ${p.brand || 'NULL'}`)
      console.log(`   - Model: ${p.model || 'NULL'}`)
      console.log(`   - Status: ${p.status}`)
      console.log(`   - Stock: ${p.stock}`)
      console.log(`   - Price: $${p.price} ${p.currency}`)
      console.log(`   - Published: ${p.published ? 'YES ⚠️' : 'NO ✅'}`)
      console.log('')
    })
    
    const publishedTest = testProducts.filter(p => p.published)
    if (publishedTest.length > 0) {
      console.log(`❌ BLOCKER: ${publishedTest.length} test product(s) are PUBLISHED\n`)
      console.log('Action required: Unpublish all test products before going live\n')
    }
  }
  
  // Report real products
  console.log('========================================')
  console.log('REAL PRODUCTS (inventory validation)')
  console.log('========================================\n')
  
  if (realProducts.length === 0) {
    console.log('❌ BLOCKER: No real products found\n')
  } else {
    console.log(`Found ${realProducts.length} real product(s):\n`)
    
    realProducts.forEach((p, i) => {
      const issues = []
      
      // Validation checks
      if (!p.title || p.title.length < 5) issues.push('Title too short')
      if (!p.brand) issues.push('Missing brand')
      if (!p.model) issues.push('Missing model')
      if (!p.price || p.price <= 0) issues.push('Invalid price')
      if (p.stock === null || p.stock === undefined) issues.push('Stock not set')
      if (p.status !== 'available' && p.status !== 'sold') issues.push('Invalid status')
      if (!p.published) issues.push('Not published')
      if (!p.images || p.images.length === 0) issues.push('No images')
      
      const hasIssues = issues.length > 0
      
      console.log(`${i + 1}. ${p.title} ${hasIssues ? '⚠️' : '✅'}`)
      console.log(`   - ID: ${p.id}`)
      console.log(`   - Brand: ${p.brand || 'NULL'}`)
      console.log(`   - Model: ${p.model || 'NULL'}`)
      console.log(`   - Status: ${p.status}`)
      console.log(`   - Stock: ${p.stock}`)
      console.log(`   - Price: $${p.price} ${p.currency}`)
      console.log(`   - Published: ${p.published ? 'YES' : 'NO'}`)
      console.log(`   - Images: ${p.images?.length || 0}`)
      
      if (issues.length > 0) {
        console.log(`   - Issues: ${issues.join(', ')}`)
      }
      
      console.log('')
    })
    
    const publishedReal = realProducts.filter(p => p.published)
    const availableReal = realProducts.filter(p => p.status === 'available' && p.published)
    
    console.log(`Summary:`)
    console.log(`  - Total real products: ${realProducts.length}`)
    console.log(`  - Published: ${publishedReal.length}`)
    console.log(`  - Available for sale: ${availableReal.length}`)
    console.log('')
    
    if (availableReal.length === 0) {
      console.log('⚠️  WARNING: No products available for sale\n')
    }
  }
  
  // Summary
  console.log('========================================')
  console.log('SUMMARY')
  console.log('========================================\n')
  
  const blockers = []
  
  if (testProducts.filter(p => p.published).length > 0) {
    blockers.push('Test products are published')
  }
  
  if (realProducts.length === 0) {
    blockers.push('No real products in inventory')
  }
  
  if (realProducts.filter(p => p.published && p.status === 'available').length === 0) {
    blockers.push('No products available for sale')
  }
  
  if (blockers.length > 0) {
    console.log('❌ BLOCKERS FOUND:\n')
    blockers.forEach((b, i) => console.log(`   ${i + 1}. ${b}`))
    console.log('')
  } else {
    console.log('✅ Products audit PASS\n')
  }
}

auditProducts()
