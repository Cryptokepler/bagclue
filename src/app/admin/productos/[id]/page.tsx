import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'
import EditProductForm from '@/components/admin/EditProductForm'

async function getProduct(id: string) {
  const { data: product, error } = await supabaseAdmin
    .from('products')
    .select('*, product_images(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return product
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
    redirect('/admin/login')
  }

  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    redirect('/admin')
  }

  return <EditProductForm product={product} />
}
