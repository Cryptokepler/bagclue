import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(supabaseUrl, supabaseKey)

const { data, error } = await supabase
  .from('products')
  .select('id, title, brand, model, color, slug, status, is_published, created_at')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

if (error) {
  console.error('Error:', error)
  process.exit(1)
}

console.log('=== PRODUCTO MÁS RECIENTE ===\n')
console.log('ID:', data.id)
console.log('Title:', data.title)
console.log('Brand:', data.brand)
console.log('Model:', data.model || '(null)')
console.log('Color:', data.color || '(null)')
console.log('Slug:', data.slug)
console.log('Status:', data.status)
console.log('Is Published:', data.is_published)
console.log('Created At:', data.created_at)
console.log('\n=== VALIDACIONES ===\n')

// Validar slug URL-safe
const hasSpaces = data.slug.includes(' ')
const isUrlSafe = /^[a-z0-9-]+$/.test(data.slug)
const words = data.slug.split('-')
const uniqueWords = [...new Set(words)]
const hasDuplicates = words.length !== uniqueWords.length

console.log('✓ Slug URL-safe (solo a-z, 0-9, -):', isUrlSafe ? '✅ PASS' : '❌ FAIL')
console.log('✓ Sin espacios:', !hasSpaces ? '✅ PASS' : '❌ FAIL')
console.log('✓ Sin palabras duplicadas:', !hasDuplicates ? '✅ PASS' : '❌ FAIL')

if (hasDuplicates) {
  console.log('\n⚠️ Palabras duplicadas detectadas:')
  const wordCount = {}
  words.forEach(w => {
    wordCount[w] = (wordCount[w] || 0) + 1
  })
  Object.entries(wordCount).forEach(([word, count]) => {
    if (count > 1) {
      console.log(`  - "${word}" aparece ${count} veces`)
    }
  })
}

if (data.is_published) {
  console.log('\n✓ Producto publicado, debe abrir en: /catalogo/' + data.slug)
} else {
  console.log('\n✓ Producto NO publicado (is_published=false)')
}
