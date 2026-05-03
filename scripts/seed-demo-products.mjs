#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local from project root
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const demoProducts = [
  {
    slug: 'chanel-classic-flap-negro',
    title: 'Chanel Classic Flap Negro',
    brand: 'Chanel',
    model: 'Classic Flap 25 Mediana',
    color: 'Negro',
    origin: 'USA',
    status: 'available',
    condition: 'excellent',
    price: 189000,
    currency: 'MXN',
    category: 'Bolsas',
    badge: 'Pieza única',
    description: 'El Classic Flap negro más buscado. Piel de cordero impecable con herrajes dorados. Una inversión que se revaloriza cada temporada.',
    is_published: true,
    includes_box: true,
    includes_dust_bag: true,
    includes_papers: false,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=800&fit=crop&q=80',
        alt: 'Chanel Classic Flap Negro - Vista frontal',
        position: 0
      }
    ]
  },
  {
    slug: 'hermes-birkin-30-gold',
    title: 'Hermès Birkin 30 Gold',
    brand: 'Hermès',
    model: 'Birkin 30',
    color: 'Gold',
    origin: 'Francia',
    status: 'preorder',
    condition: 'new',
    price: 450000,
    currency: 'MXN',
    category: 'Bolsas',
    badge: 'Edición limitada',
    description: 'La bolsa más exclusiva del mundo. Piel Togo dorada con herrajes dorados. Lista de espera de años en boutique — disponible ahora en pre-venta.',
    is_published: true,
    includes_box: true,
    includes_dust_bag: true,
    includes_papers: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=800&fit=crop&q=80',
        alt: 'Hermès Birkin 30 Gold - Vista frontal',
        position: 0
      }
    ]
  }
]

async function seed() {
  console.log('🌱 Seeding demo products...\n')

  for (const productData of demoProducts) {
    const { images, ...product } = productData

    console.log(`📦 Creating product: ${product.title}`)

    // Insert product
    const { data: insertedProduct, error: productError } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()

    if (productError) {
      console.error(`❌ Error inserting product ${product.title}:`, productError.message)
      continue
    }

    console.log(`✅ Product created: ${insertedProduct.id}`)

    // Insert images
    for (const image of images) {
      const { error: imageError } = await supabase
        .from('product_images')
        .insert({
          product_id: insertedProduct.id,
          ...image
        })

      if (imageError) {
        console.error(`❌ Error inserting image:`, imageError.message)
      } else {
        console.log(`   ✅ Image added`)
      }
    }

    console.log('')
  }

  console.log('✅ Seeding complete!\n')
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
