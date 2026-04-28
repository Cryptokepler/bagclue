import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'
import LogoutButton from '@/components/admin/LogoutButton'

async function getProducts() {
  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('*, product_images(url)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return products || []
}

export default async function AdminDashboardPage() {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
    redirect('/admin/login')
  }

  const products = await getProducts()

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#FF69B4]/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl text-white">
              BAGCLUE Admin
            </h1>
            <p className="text-xs text-gray-400 mt-1">Panel de gestión de productos</p>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <div className="text-3xl font-bold text-white mb-1">
              {products.length}
            </div>
            <div className="text-sm text-gray-400">Total productos</div>
          </div>
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <div className="text-3xl font-bold text-emerald-400 mb-1">
              {products.filter(p => p.is_published).length}
            </div>
            <div className="text-sm text-gray-400">Publicados</div>
          </div>
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <div className="text-3xl font-bold text-[#FF69B4] mb-1">
              {products.filter(p => !p.is_published).length}
            </div>
            <div className="text-sm text-gray-400">Ocultos</div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white/5 border border-[#FF69B4]/20">
          <div className="px-6 py-4 border-b border-[#FF69B4]/10">
            <h2 className="text-lg text-white font-medium">Productos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Producto</th>
                  <th className="px-6 py-3">Marca</th>
                  <th className="px-6 py-3">Precio</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Publicado</th>
                  <th className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FF69B4]/10">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No hay productos todavía
                    </td>
                  </tr>
                ) : (
                  products.map((product: any) => (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.product_images?.[0]?.url ? (
                            <img
                              src={product.product_images[0].url}
                              alt={product.title}
                              className="w-12 h-12 object-cover border border-[#FF69B4]/20"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-white/5 border border-[#FF69B4]/20 flex items-center justify-center">
                              <span className="text-xs text-gray-500">Sin img</span>
                            </div>
                          )}
                          <div>
                            <div className="text-white text-sm font-medium">{product.title}</div>
                            <div className="text-gray-400 text-xs">{product.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{product.brand}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {product.price ? `$${product.price.toLocaleString()} ${product.currency}` : 'Consultar'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          product.status === 'available' ? 'bg-emerald-500/20 text-emerald-400' :
                          product.status === 'preorder' ? 'bg-[#C9A96E]/20 text-[#C9A96E]' :
                          product.status === 'reserved' ? 'bg-yellow-500/20 text-yellow-400' :
                          product.status === 'sold' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.is_published ? (
                          <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full"></span>
                        ) : (
                          <span className="inline-block w-2 h-2 bg-gray-500 rounded-full"></span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/catalogo/${product.slug}`}
                            target="_blank"
                            className="text-xs text-[#FF69B4] hover:underline"
                          >
                            Ver
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
