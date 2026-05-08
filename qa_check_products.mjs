import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, slug, price, status, is_published, stock')
    .or('title.ilike.%test%,title.ilike.%qa%')
    .limit(5)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log('TEST PRODUCTS FOUND:')
  console.log(JSON.stringify(data, null, 2))
}

checkProducts()
