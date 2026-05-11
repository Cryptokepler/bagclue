/**
 * Audit Product Images
 * Check product_images table for published products
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

const PUBLISHED_PRODUCTS = [
  '28f4c7c4-deb8-423e-b6a0-900ee399b85a', // Pm St. Louis rosa
  'cc573dde-815c-4e80-b68e-659609605743'  // Goyard Anjou PM Vino
]

console.log('========================================')
console.log('PRODUCT IMAGES AUDIT')
console.log('========================================\n')

async function auditImages() {
  for (const productId of PUBLISHED_PRODUCTS) {
    // Get product info
    const { data: product } = await supabase
      .from('products')
      .select('title, brand, slug')
      .eq('id', productId)
      .single()
    
    console.log(`Product: ${product?.title} (${product?.brand})`)
    console.log(`ID: ${productId}`)
    console.log(`URL: https://bagclue.vercel.app/catalogo/${product?.slug}`)
    console.log('')
    
    // Check product_images table
    const { data: images, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true })
    
    if (error) {
      console.log(`❌ Error querying images: ${error.message}`)
    } else if (!images || images.length === 0) {
      console.log(`❌ No images found in product_images table`)
    } else {
      console.log(`✅ Found ${images.length} image(s):`)
      images.forEach((img, i) => {
        console.log(`   ${i + 1}. ${img.image_url}`)
        console.log(`      - Display order: ${img.display_order}`)
        console.log(`      - Is primary: ${img.is_primary || false}`)
      })
    }
    
    console.log('')
  }
}

auditImages()
