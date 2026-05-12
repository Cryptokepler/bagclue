import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const SUPABASE_URL = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Normalize text for slug
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

// Generate slug base
function generateSlugBase(params) {
  const { brand, title, model, color } = params
  const parts = []
  
  if (brand) parts.push(brand)
  if (model) parts.push(model)
  if (title) parts.push(title)
  if (color) parts.push(color)
  
  const fullText = parts.join(' ')
  const normalized = normalizeText(fullText)
  const words = normalized.split(/\s+/).filter(w => w.length > 0)
  const uniqueWords = Array.from(new Set(words))
  
  return uniqueWords.join('-')
}

// Ensure unique slug
async function ensureUniqueSlug(baseSlug) {
  const { data: existing } = await supabase
    .from('products')
    .select('slug')
    .eq('slug', baseSlug)
    .maybeSingle()
  
  if (!existing) {
    return baseSlug
  }
  
  for (let i = 2; i <= 100; i++) {
    const candidate = `${baseSlug}-${i}`
    
    const { data: candidateExists } = await supabase
      .from('products')
      .select('slug')
      .eq('slug', candidate)
      .maybeSingle()
    
    if (!candidateExists) {
      return candidate
    }
  }
  
  const shortId = Math.random().toString(36).substring(2, 10)
  return `${baseSlug}-${shortId}`
}

// Generate unique slug
async function generateUniqueSlug(params) {
  const baseSlug = generateSlugBase(params)
  return await ensureUniqueSlug(baseSlug)
}

// Main function
async function createProduct() {
  console.log('🚀 Creando producto Chanel Mini Preppy Rosa...\n')
  
  // 1. Generate slug
  const slug = await generateUniqueSlug({
    brand: 'Chanel',
    title: 'Mini Preppy Rosa',
    model: 'Mini Preppy',
    color: 'Rosa'
  })
  
  console.log(`✅ Slug generado: ${slug}`)
  
  // 2. Create product
  const productData = {
    slug,
    title: 'Chanel Mini Preppy Rosa',
    brand: 'Chanel',
    model: 'Mini Preppy',
    color: 'Rosa',
    material: 'Piel',
    status: 'available',
    condition: 'new',
    category: 'Bolsas',
    price: 99000,
    currency: 'MXN',
    description: 'Chanel Mini Preppy en piel color rosa, una pieza femenina y elegante con silueta compacta, solapa frontal, herraje CC dorado y asas largas para llevar al hombro. Su tono rosa la convierte en una pieza protagonista, ideal para looks delicados, frescos y sofisticados.',
    is_published: false, // INACTIVO
    authenticity_verified: false,
    includes_box: false,
    includes_dust_bag: false,
    includes_papers: false,
    stock: 1
  }
  
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single()
  
  if (productError) {
    console.error('❌ Error creando producto:', productError)
    process.exit(1)
  }
  
  console.log(`✅ Producto creado exitosamente`)
  console.log(`   ID: ${product.id}`)
  console.log(`   Slug: ${product.slug}`)
  
  // 3. Upload image
  const imagePath = '/home/node/.openclaw/media/inbound/file_918---4c19d413-1628-4184-ac16-78b5ffeaca8b.jpg'
  
  if (!fs.existsSync(imagePath)) {
    console.error('❌ Imagen no encontrada:', imagePath)
    process.exit(1)
  }
  
  const imageBuffer = fs.readFileSync(imagePath)
  const timestamp = Date.now()
  const fileName = `${product.id}/${timestamp}.jpg`
  
  console.log(`\n📤 Subiendo imagen a Supabase Storage...`)
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: false
    })
  
  if (uploadError) {
    console.error('❌ Error subiendo imagen:', uploadError)
    process.exit(1)
  }
  
  console.log(`✅ Imagen subida: ${fileName}`)
  
  // 4. Get public URL
  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName)
  
  const imageUrl = urlData.publicUrl
  console.log(`✅ URL pública: ${imageUrl}`)
  
  // 5. Insert image record
  const { data: imageRecord, error: imageError } = await supabase
    .from('product_images')
    .insert({
      product_id: product.id,
      url: imageUrl,
      alt: 'Chanel Mini Preppy Rosa',
      position: 0
    })
    .select()
    .single()
  
  if (imageError) {
    console.error('❌ Error creando registro de imagen:', imageError)
    process.exit(1)
  }
  
  console.log(`✅ Registro de imagen creado (ID: ${imageRecord.id})`)
  
  // 6. Report
  console.log('\n' + '='.repeat(60))
  console.log('✅ PRODUCTO CREADO EXITOSAMENTE')
  console.log('='.repeat(60))
  console.log(`\n📋 Detalles del producto:`)
  console.log(`   Product ID: ${product.id}`)
  console.log(`   Slug: ${product.slug}`)
  console.log(`   Status: ${product.status}`)
  console.log(`   Stock: ${product.stock}`)
  console.log(`   Published: ${product.is_published ? 'SÍ' : 'NO (INACTIVO)'}`)
  console.log(`   Precio: $${product.price.toLocaleString()} ${product.currency}`)
  console.log(`\n🔗 URLs:`)
  console.log(`   Admin: https://bagclue.vercel.app/admin/productos/${product.id}`)
  console.log(`   Preview público: https://bagclue.vercel.app/catalogo/${product.slug}`)
  console.log(`   Imagen: ${imageUrl}`)
  console.log(`\n⚠️  El producto está INACTIVO (is_published=false)`)
  console.log(`   Activar manualmente desde admin panel cuando esté listo.`)
  console.log('\n' + '='.repeat(60))
}

// Execute
createProduct()
  .then(() => {
    console.log('\n✅ Script completado exitosamente')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  })
