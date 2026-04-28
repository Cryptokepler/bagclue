import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'
import AdminNav from '@/components/admin/AdminNav'

async function getOrders() {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*, products(title, brand))')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  return orders || []
}

export default async function AdminOrdersPage() {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
    redirect('/admin/login')
  }

  const orders = await getOrders()

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminNav />

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <div className="text-3xl font-bold text-white mb-1">
              {orders.length}
            </div>
            <div className="text-sm text-gray-400">Total órdenes</div>
          </div>
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <div className="text-3xl font-bold text-emerald-400 mb-1">
              {orders.filter(o => o.payment_status === 'paid').length}
            </div>
            <div className="text-sm text-gray-400">Pagadas</div>
          </div>
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <div className="text-3xl font-bold text-yellow-400 mb-1">
              {orders.filter(o => o.payment_status === 'pending').length}
            </div>
            <div className="text-sm text-gray-400">Pendientes</div>
          </div>
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <div className="text-3xl font-bold text-gray-400 mb-1">
              {orders.filter(o => o.status === 'cancelled').length}
            </div>
            <div className="text-sm text-gray-400">Canceladas</div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white/5 border border-[#FF69B4]/20">
          <div className="px-6 py-4 border-b border-[#FF69B4]/10">
            <h2 className="text-lg text-white font-medium">Órdenes Recientes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Productos</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Pago</th>
                  <th className="px-6 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FF69B4]/10">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No hay órdenes todavía
                    </td>
                  </tr>
                ) : (
                  orders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-white text-sm">{order.customer_name}</div>
                        <div className="text-gray-400 text-xs">{order.customer_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-300 text-sm">
                          {order.order_items?.map((item: any, idx: number) => (
                            <div key={idx}>
                              {item.products?.brand} {item.products?.title}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        ${order.total.toLocaleString()} MXN
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          order.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                          order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          order.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                          order.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('es-MX')}
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
