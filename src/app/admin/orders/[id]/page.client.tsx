'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminNav from '@/components/admin/AdminNav'
import ShippingInfoForm from '@/components/admin/ShippingInfoForm'
import ShippingProofSection from '@/components/admin/ShippingProofSection'
import ClientDate from '@/components/ClientDate'
import { formatNumber } from '@/lib/format'

interface OrderDetailClientProps {
  orderId: string
}

export default function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientMounted, setClientMounted] = useState(false)

  // CRITICAL: Ensure NO SSR of dynamic content
  useEffect(() => {
    setClientMounted(true)
  }, [])

  useEffect(() => {
    if (!clientMounted) return
    
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/${orderId}`)
        
        if (response.status === 401) {
          router.push('/admin/login')
          return
        }

        if (response.status === 404) {
          router.push('/admin/orders')
          return
        }

        if (!response.ok) {
          throw new Error('Error al cargar orden')
        }

        const data = await response.json()
        setOrder(data.order)
        setLoading(false)
      } catch (err: any) {
        console.error('[ORDER DETAIL] Error:', err)
        setError(err.message || 'Error al cargar orden')
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, router, clientMounted])

  // CRITICAL: Return stable fallback before client mount
  if (!clientMounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Cargando orden...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <AdminNav />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-white">
            Cargando orden...
          </div>
        </main>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <AdminNav />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-red-400">
            {error || 'Orden no encontrada'}
          </div>
          <div className="mt-4 text-center">
            <Link href="/admin/orders" className="text-[#FF69B4] hover:underline">
              ← Volver a órdenes
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminNav />

      {/* BUILD TEST MARKER */}
      <div className="bg-yellow-500 text-black text-center py-3 px-4 font-bold text-sm">
        🔍 BUILD TEST fc61bd9 - PRUEBA A ACTIVA 🔍
      </div>

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
                        ${formatNumber(item.unit_price)} {item.product_snapshot?.currency || 'MXN'}
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
                  <span>${formatNumber(order.subtotal)} MXN</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Envío</span>
                  <span>${formatNumber(order.shipping)} MXN</span>
                </div>
                <div className="flex justify-between text-lg text-white font-medium pt-2 border-t border-[#FF69B4]/10">
                  <span>Total</span>
                  <span>${formatNumber(order.total)} MXN</span>
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

            {/* Shipping Info Form */}
            <ShippingInfoForm
              orderId={order.id}
              initialData={{
                status: order.status,
                customer_phone: order.customer_phone,
                shipping_address: order.shipping_address,
                shipping_status: order.shipping_status,
                shipping_provider: order.shipping_provider,
                tracking_number: order.tracking_number,
                tracking_url: order.tracking_url,
                tracking_token: order.tracking_token,
                notes: order.notes
              }}
            />

            {/* Comprobante de Envío */}
            <ShippingProofSection
              orderId={order.id}
              currentProof={{
                url: order.shipping_proof_url,
                fileName: order.shipping_proof_file_name,
                fileSize: order.shipping_proof_file_size,
                uploadedAt: order.shipping_proof_uploaded_at
              }}
            />
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
                    <ClientDate date={order.created_at} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Actualizada</div>
                  <div className="text-sm text-gray-300">
                    <ClientDate date={order.updated_at} />
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
