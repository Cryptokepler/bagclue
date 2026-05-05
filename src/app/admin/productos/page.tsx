import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'
import AdminNav from '@/components/admin/AdminNav'
import ProductFilters from '@/components/admin/ProductFilters'
import ProductsTable from '@/components/admin/ProductsTable'
import ProductCard from '@/components/admin/ProductCard'
import { calculateAdditionalCostsTotal, calculateProductMetrics, formatCurrency, formatMargin, calculateAverageMargin } from '@/lib/product-metrics'

// Forzar dynamic rendering para que los filtros funcionen
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

async function getProducts(filters: any) {
  let query = supabaseAdmin
    .from('products')
    .select(`
      id,
      title,
      slug,
      brand,
      model,
      category,
      price,
      currency,
      description,
      status,
      is_published,
      stock,
      cost_price,
      additional_costs,
      supplier_name,
      physical_location,
      authenticity_verified,
      condition_notes,
      created_at,
      acquisition_date,
      product_images(url)
    `)
  
  // Aplicar filtros
  
  // Búsqueda
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`)
  }
  
  // Status
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  
  // Publicado/Borrador
  if (filters.published === 'published') {
    query = query.eq('is_published', true)
  } else if (filters.published === 'draft') {
    query = query.eq('is_published', false)
  }
  
  // Categoría (case-insensitive para manejar mayúsculas/acentos)
  if (filters.category && filters.category !== 'all') {
    query = query.ilike('category', filters.category)
  }
  
  // Costo (con/sin)
  if (filters.cost === 'with-cost') {
    query = query.not('cost_price', 'is', null).gt('cost_price', 0)
  } else if (filters.cost === 'without-cost') {
    query = query.or('cost_price.is.null,cost_price.eq.0')
  }
  
  // Autenticidad
  if (filters.auth === 'verified') {
    query = query.eq('authenticity_verified', true)
  } else if (filters.auth === 'not-verified') {
    query = query.eq('authenticity_verified', false)
  }
  
  query = query.order('created_at', { ascending: false })
  
  const { data: products, error } = await query
  
  if (error) {
    console.error('Error fetching products:', error)
    return []
  }
  
  // Filtros que requieren procesamiento en cliente
  let filteredProducts = products || []
  
  // Filtro de imágenes (no se puede hacer en query Supabase fácilmente)
  if (filters.images === 'with-image') {
    filteredProducts = filteredProducts.filter(p => p.product_images && p.product_images.length > 0)
  } else if (filters.images === 'without-image') {
    filteredProducts = filteredProducts.filter(p => !p.product_images || p.product_images.length === 0)
  }
  
  return filteredProducts
}

export default async function AdminProductosPage({ searchParams }: PageProps) {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
    redirect('/admin/login')
  }
  
  const filters = {
    search: typeof searchParams.search === 'string' ? searchParams.search : '',
    status: typeof searchParams.status === 'string' ? searchParams.status : 'all',
    published: typeof searchParams.published === 'string' ? searchParams.published : 'all',
    category: typeof searchParams.category === 'string' ? searchParams.category : 'all',
    images: typeof searchParams.images === 'string' ? searchParams.images : 'all',
    cost: typeof searchParams.cost === 'string' ? searchParams.cost : 'all',
    auth: typeof searchParams.auth === 'string' ? searchParams.auth : 'all'
  }
  
  const products = await getProducts(filters)
  
  // Calcular stats
  const stats = {
    total: products.length,
    published: products.filter(p => p.is_published).length,
    draft: products.filter(p => !p.is_published).length,
    available: products.filter(p => p.status === 'available').length,
    sold: products.filter(p => p.status === 'sold').length,
    totalValue: products
      .filter(p => ['available', 'preorder'].includes(p.status))
      .reduce((sum, p) => sum + (Number(p.price) || 0), 0),
    totalCost: products
      .filter(p => ['available', 'preorder'].includes(p.status))
      .reduce((sum, p) => {
        const costPrice = Number(p.cost_price) || 0
        const additionalTotal = calculateAdditionalCostsTotal(p.additional_costs)
        return sum + costPrice + additionalTotal
      }, 0),
    averageMargin: calculateAverageMargin(
      products.filter(p => ['available', 'preorder'].includes(p.status))
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminNav />

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Inventario de Productos</h1>
          <p className="text-gray-400">Gestión completa de productos con rentabilidad y alertas</p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {/* Total */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-4">
            <div className="text-2xl font-bold text-white mb-1">
              {stats.total}
            </div>
            <div className="text-xs text-gray-400">Total productos</div>
          </div>
          
          {/* Publicados */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-4">
            <div className="text-2xl font-bold text-emerald-400 mb-1">
              {stats.published}
            </div>
            <div className="text-xs text-gray-400">Publicados</div>
          </div>
          
          {/* Borradores */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-4">
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {stats.draft}
            </div>
            <div className="text-xs text-gray-400">Borradores</div>
          </div>
          
          {/* Disponibles */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-4">
            <div className="text-2xl font-bold text-emerald-300 mb-1">
              {stats.available}
            </div>
            <div className="text-xs text-gray-400">Disponibles</div>
          </div>
          
          {/* Vendidos */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-4">
            <div className="text-2xl font-bold text-red-400 mb-1">
              {stats.sold}
            </div>
            <div className="text-xs text-gray-400">Vendidos</div>
          </div>
          
          {/* Valor Inventario */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-4">
            <div className="text-2xl font-bold text-[#C9A96E] mb-1">
              {formatCurrency(stats.totalValue)}
            </div>
            <div className="text-xs text-gray-400">Valor disponible</div>
          </div>
          
          {/* Costo Total (opcional) */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-4">
            <div className="text-2xl font-bold text-gray-400 mb-1">
              {formatCurrency(stats.totalCost)}
            </div>
            <div className="text-xs text-gray-400">Costo disponible</div>
          </div>
          
          {/* Margen Promedio (opcional) */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-4">
            <div className="text-2xl font-bold text-cyan-400 mb-1">
              {formatMargin(stats.averageMargin)}
            </div>
            <div className="text-xs text-gray-400">Margen promedio</div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="mb-6 flex gap-4">
          <a
            href="/admin/productos/new"
            className="inline-block bg-[#FF69B4] text-[#0a0a0a] font-medium px-6 py-3 hover:bg-[#FF69B4]/90 transition-colors"
          >
            + Crear Producto
          </a>
          <a
            href="/admin"
            className="inline-block border border-[#FF69B4]/20 text-gray-300 px-6 py-3 hover:border-[#FF69B4] transition-colors"
          >
            ← Dashboard
          </a>
        </div>
        
        {/* Filtros */}
        <ProductFilters />
        
        {/* Contador de resultados */}
        <div className="mb-4 text-sm text-gray-400">
          {products.length === 0 ? (
            <span className="text-yellow-400">⚠️ No hay productos que coincidan con los filtros</span>
          ) : (
            <span>
              {products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {/* Tabla Desktop */}
        <div className="hidden lg:block">
          <ProductsTable products={products} />
        </div>
        
        {/* Cards Mobile */}
        <div className="lg:hidden space-y-4">
          {products.length === 0 ? (
            <div className="bg-white/5 border border-[#FF69B4]/20 p-12 text-center">
              <p className="text-gray-400">No hay productos que coincidan con los filtros</p>
            </div>
          ) : (
            products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </main>
    </div>
  )
}
