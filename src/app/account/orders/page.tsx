'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AccountLayout from '@/components/customer/AccountLayout'
import { supabaseCustomer } from '@/lib/supabase-customer'

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    preparing: 'bg-blue-100 text-blue-700 border-blue-200',
    shipped: 'bg-purple-100 text-purple-700 border-purple-200',
    delivered: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200'
  }
  
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
  }
  
  return {
    style: styles[status] || styles.pending,
    label: labels[status] || status
  }
}

function getPaymentBadge(status: string) {
  if (status === 'paid') {
    return {
      style: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      label: 'Pagado'
    }
  }
  return {
    style: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    label: 'Pendiente'
  }
}

function getShippingBadge(shippingStatus: string | null | undefined) {
  if (!shippingStatus) {
    return {
      style: 'bg-gray-100 text-gray-600 border-gray-200',
      label: 'Pendiente de envío',
      icon: '📦'
    }
  }

  const badges: Record<string, { style: string; label: string; icon: string }> = {
    pending: {
      style: 'bg-gray-100 text-gray-600 border-gray-200',
      label: 'Pendiente de envío',
      icon: '📦'
    },
    preparing: {
      style: 'bg-blue-100 text-blue-700 border-blue-200',
      label: 'Preparando pieza',
      icon: '📦'
    },
    shipped: {
      style: 'bg-purple-100 text-purple-700 border-purple-200',
      label: 'Enviado',
      icon: '🚚'
    },
    delivered: {
      style: 'bg-green-100 text-green-700 border-green-200',
      label: 'Entregado',
      icon: '✅'
    }
  }

  return badges[shippingStatus] || badges.pending
}

function getAddressBadge(paymentStatus: string, shippingAddress: string | null | undefined) {
  // Solo mostrar si está pagado
  if (paymentStatus !== 'paid') {
    return null
  }
  
  // Si está pagado pero no hay dirección confirmada
  if (!shippingAddress || shippingAddress.trim() === '') {
    return {
      style: 'bg-orange-100 text-orange-700 border-orange-200',
      label: 'Dirección pendiente',
      icon: '⚠️'
    }
  }
  
  // Si está pagado y hay dirección confirmada
  return {
    style: 'bg-teal-100 text-teal-700 border-teal-200',
    label: 'Dirección confirmada',
    icon: '✅'
  }
}

function getNextStepBadge(order: any) {
  // Pago pendiente
  if (order.payment_status !== 'paid') {
    return {
      style: 'bg-gray-100 text-gray-700 border-gray-200',
      label: 'Esperando pago',
      icon: '⏳'
    }
  }
  
  // Entregado
  if (order.shipping_status === 'delivered') {
    return {
      style: 'bg-green-100 text-green-700 border-green-200',
      label: 'Entregado',
      icon: '✅'
    }
  }
  
  // Enviado
  if (order.shipping_status === 'shipped') {
    return {
      style: 'bg-purple-100 text-purple-700 border-purple-200',
      label: 'En camino',
      icon: '🚚'
    }
  }
  
  // Preparando
  if (order.shipping_status === 'preparing') {
    return {
      style: 'bg-blue-100 text-blue-700 border-blue-200',
      label: 'Preparando pieza',
      icon: '📦'
    }
  }
  
  // Sin dirección
  if (!order.shipping_address) {
    return {
      style: 'bg-orange-100 text-orange-700 border-orange-200',
      label: 'Confirma dirección',
      icon: '⚠️'
    }
  }
  
  // Dirección confirmada + pending
  return {
    style: 'bg-gray-100 text-gray-700 border-gray-200',
    label: 'Preparación pendiente',
    icon: '📦'
  }
}

export default function CustomerOrdersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  const [userEmail, setUserEmail] = useState<string | undefined>()

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const { data: { user }, error: userError } = await supabaseCustomer.auth.getUser()
        
        if (userError || !user) {
          router.push('/account/login')
          return
        }
        
        setUserEmail(user.email)
        
        // Get orders - RLS policy will filter to only user's orders
        const { data: ordersData, error } = await supabaseCustomer
          .from('orders')
          .select(`
            id,
            customer_name,
            customer_email,
            total,
            status,
            payment_status,
            shipping_status,
            shipping_address,
            shipping_provider,
            tracking_token,
            tracking_number,
            tracking_url,
            created_at,
            order_items(
              id,
              quantity,
              unit_price,
              product_snapshot
            )
          `)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('[ORDERS PAGE] Error fetching orders:', error)
        }
        
        setOrders(ordersData || [])
        setLoading(false)
      } catch (error) {
        console.error('[ORDERS PAGE] Unexpected error:', error)
        setLoading(false)
      }
    }

    loadOrders()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <AccountLayout userEmail={userEmail}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl text-gray-900 mb-2">
            Mis Pedidos
          </h1>
          <p className="text-gray-600">
            Historial completo de tus compras en Bagclue
          </p>
        </div>
        
        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-4xl mb-4">🛍️</p>
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              No tienes pedidos todavía
            </h2>
            <p className="text-gray-600 mb-6">
              Explora nuestro catálogo y encuentra tu próxima pieza de lujo
            </p>
            <Link
              href="/catalogo"
              className="inline-block bg-[#FF69B4] text-white px-8 py-3 hover:bg-[#FF69B4]/90 transition-colors"
            >
              Ver catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const statusBadge = getStatusBadge(order.status)
              const paymentBadge = getPaymentBadge(order.payment_status)
              const shippingBadge = getShippingBadge(order.shipping_status)
              const addressBadge = getAddressBadge(order.payment_status, order.shipping_address)
              const nextStepBadge = getNextStepBadge(order)
              
              // Get first product image for preview
              const firstItem = order.order_items?.[0]
              const productCount = order.order_items?.length || 0
              
              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="block bg-white border border-gray-200 rounded-lg p-6 hover:border-[#FF69B4] hover:shadow-md transition-all group"
                >
                  <div className="flex gap-6">
                    {/* Order Info */}
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-mono text-sm text-gray-600">
                              #{order.id.slice(0, 8)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded border ${paymentBadge.style}`}>
                              {paymentBadge.label}
                            </span>
                            {addressBadge && (
                              <span className={`text-xs px-2 py-1 rounded border ${addressBadge.style} flex items-center gap-1`}>
                                <span>{addressBadge.icon}</span>
                                <span>{addressBadge.label}</span>
                              </span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded border ${shippingBadge.style} flex items-center gap-1`}>
                              <span>{shippingBadge.icon}</span>
                              <span>{shippingBadge.label}</span>
                            </span>
                          </div>
                          {/* Próximo paso badge */}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2.5 py-1 rounded border font-medium ${nextStepBadge.style} flex items-center gap-1.5`}>
                              <span>{nextStepBadge.icon}</span>
                              <span>{nextStepBadge.label}</span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-2xl font-medium text-gray-900">
                            ${order.total.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">MXN</p>
                        </div>
                      </div>
                      
                      {/* Products Summary */}
                      <div className="space-y-2">
                        {order.order_items?.slice(0, 2).map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="w-1.5 h-1.5 bg-[#FF69B4] rounded-full"></span>
                            <span className="font-medium">
                              {item.product_snapshot?.brand}
                            </span>
                            <span>
                              {item.product_snapshot?.title}
                            </span>
                          </div>
                        ))}
                        
                        {productCount > 2 && (
                          <p className="text-sm text-gray-500 ml-3.5">
                            +{productCount - 2} producto{productCount - 2 > 1 ? 's' : ''} más
                          </p>
                        )}
                      </div>
                      
                      {/* Shipping & Tracking Info */}
                      {(order.shipping_provider || order.tracking_number || order.tracking_token || order.tracking_url) && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="space-y-1.5">
                            {order.shipping_provider && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">Paquetería:</span>
                                <span className="font-medium text-gray-900">
                                  {order.shipping_provider === 'dhl' ? 'DHL Express' :
                                   order.shipping_provider === 'fedex' ? 'FedEx' :
                                   order.shipping_provider}
                                </span>
                              </div>
                            )}
                            
                            {order.tracking_number && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">Rastreo:</span>
                                <span className="font-mono text-gray-900">{order.tracking_number}</span>
                              </div>
                            )}
                            
                            {(order.tracking_token || order.tracking_url) && (
                              <div className="mt-2">
                                <button className="text-xs bg-pink-50 text-pink-600 px-3 py-1.5 rounded hover:bg-pink-100 transition-colors">
                                  Ver seguimiento →
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Arrow */}
                    <div className="flex items-center">
                      <span className="text-[#FF69B4] group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AccountLayout>
  )
}
