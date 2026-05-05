import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'

const supabase = createClient(supabaseUrl, supabaseKey)

const productId = 'aefb20e9-8e6a-4a29-a29b-986b720e87f8'

console.log('Despublicando producto test QA MVP.1C...\n')

const { data, error } = await supabase
  .from('products')
  .update({ is_published: false })
  .eq('id', productId)
  .select()
  .single()

if (error) {
  console.log('❌ ERROR:', error.message)
} else {
  console.log('✅ Producto despublicado correctamente')
  console.log('   ID:', data.id)
  console.log('   Título:', data.title)
  console.log('   is_published:', data.is_published)
  console.log('')
  console.log('El producto ya NO aparecerá en:')
  console.log('   - /catalogo')
  console.log('   - / (landing)')
  console.log('')
  console.log('Pero SÍ seguirá visible en:')
  console.log('   - /admin (listado productos)')
  console.log('   - /admin/productos/' + data.id)
}
