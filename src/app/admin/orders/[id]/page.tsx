import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'
import AdminNav from '@/components/admin/AdminNav'

async function getOrder(id: string) {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*, products(*))')
    .eq('id', id)
    .single()

  if (error || !order) return null
  return order
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
    redirect('/admin/login')
  }

  const { id } = await params
  const order = await getOrder(id)

  if (!order) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminNav />

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/orders"
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Volver a órdenes
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información de Orden */}
          <div className="lg:col-span-2 space-y-6">
            {/* Productos */}
            <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
              <h2 className="text-lg text-white font-medium mb-4">Productos Comprados</h2>
              <div className="space-y-4">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-[#FF69B4]/10 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {item.product_snapshot?.brand} {item.product_snapshot?.title}
                      </div>
                      {item.product_snapshot?.model && (
                        <div className="text-sm text-gray-400 mt-1">
                          {item.product_snapshot.model}
                        </div>
                      )}
                      {item.product_snapshot?.color && (
                        <div className="text-sm text-gray-400">
                          Color: {item.product_snapshot.color}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        SKU: {item.product_snapshot?.slug}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white">
                        ${item.unit_price.toLocaleString()} {item.product_snapshot?.currency || 'MXN'}
                      </div>
                      <div className="text-sm text-gray-400">
                        Cantidad: {item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="mt-6 pt-4 border-t border-[#FF69B4]/10 space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toLocaleString()} MXN</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Envío</span>
                  <span>${order.shipping.toLocaleString()} MXN</span>
                </div>
                <div className="flex justify-between text-lg text-white font-medium pt-2 border-t border-[#FF69B4]/10">
                  <span>Total</span>
                  <span>${order.total.toLocaleString()} MXN</span>
                </div>
              </div>
            </div>

            {/* Información Stripe */}
            <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
              <h2 className="text-lg text-white font-medium mb-4">Información de Pago</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Stripe Session ID</div>
                  <div className="text-sm text-gray-300 font-mono break-all">
                    {order.stripe_session_id || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Stripe Payment Intent ID</div>
                  <div className="text-sm text-gray-300 font-mono break-all">
                    {order.stripe_payment_intent_id || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Estado de Pago</div>
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    order.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                    order.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {order.payment_status}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Estado de Orden</div>
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    order.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                    order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cliente */}
            <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
              <h2 className="text-lg text-white font-medium mb-4">Cliente</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Nombre</div>
                  <div className="text-sm text-white">{order.customer_name}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Email</div>
                  <div className="text-sm text-gray-300">{order.customer_email}</div>
                </div>
                {order.customer_phone && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Teléfono</div>
                    <div className="text-sm text-gray-300">{order.customer_phone}</div>
                  </div>
                )}
                {order.customer_address && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Dirección</div>
                    <div className="text-sm text-gray-300">{order.customer_address}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Fechas */}
            <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
              <h2 className="text-lg text-white font-medium mb-4">Fechas</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Creada</div>
                  <div className="text-sm text-white">
                    {new Date(order.created_at).toLocaleString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Actualizada</div>
                  <div className="text-sm text-gray-300">
                    {new Date(order.updated_at).toLocaleString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Notas */}
            {order.notes && (
              <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
                <h2 className="text-lg text-white font-medium mb-4">Notas</h2>
                <div className="text-sm text-gray-300 whitespace-pre-wrap">
                  {order.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
