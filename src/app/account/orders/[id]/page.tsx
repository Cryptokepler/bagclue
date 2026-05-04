'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AccountLayout from '@/components/customer/AccountLayout'
import OrderTimeline from '@/components/OrderTimeline'
import ShippingAddressSection from '@/components/customer/ShippingAddressSection'
import { supabaseCustomer } from '@/lib/supabase-customer'

function getShippingStatusInfo(shippingStatus: string | null | undefined) {
  if (!shippingStatus) {
    return {
      emoji: '📦',
      title: 'Pendiente de envío',
      description: 'Bagclue recibió tu pedido y está preparando el proceso de envío.',
      color: 'text-gray-700',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  }

  const statuses: Record<string, any> = {
    pending: {
      emoji: '📦',
      title: 'Pendiente de envío',
      description: 'Bagclue recibió tu pedido y está preparando el proceso.',
      color: 'text-gray-700',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    preparing: {
      emoji: '📦',
      title: 'Preparando pieza',
      description: 'Estamos preparando tu pieza para envío con mucho cuidado.',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    shipped: {
      emoji: '🚚',
      title: 'Enviado',
      description: 'Tu pedido ya fue enviado y está en camino.',
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    delivered: {
      emoji: '✅',
      title: 'Entregado',
      description: 'Tu pedido fue entregado exitosamente.',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    }
  }

  return statuses[shippingStatus] || statuses.pending
}

function getStatusInfo(status: string) {
  if (status === 'cancelled') {
    return {
      emoji: '❌',
      title: 'Pedido cancelado',
      description: 'Este pedido fue cancelado. Si tienes dudas, contáctanos.',
      color: 'text-red-600'
    }
  }
  
  if (status === 'delivered') {
    return {
      emoji: '✅',
      title: 'Pedido completado',
      description: '¡Disfruta tu nueva pieza de lujo!',
      color: 'text-emerald-600'
    }
  }
  
  if (status === 'shipped') {
    return {
      emoji: '🚚',
      title: 'Pedido en tránsito',
      description: 'Revisa el estado de envío abajo.',
      color: 'text-blue-600'
    }
  }
  
  if (status === 'preparing') {
    return {
      emoji: '📦',
      title: 'Preparando pedido',
      description: 'Estamos preparando tu pedido.',
      color: 'text-purple-600'
    }
  }
  
  if (status === 'confirmed') {
    return {
      emoji: '✓',
      title: 'Pedido confirmado',
      description: 'Tu pedido ha sido confirmado.',
      color: 'text-emerald-600'
    }
  }
  
  return {
    emoji: '⏳',
    title: 'Procesando pedido',
    description: 'Estamos procesando tu pedido.',
    color: 'text-gray-600'
  }
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params.id as string
  const action = searchParams.get('action')
  
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const loadOrder = async () => {
      try {
        // Check auth
        const { data: { user }, error: userError } = await supabaseCustomer.auth.getUser()
        
        if (userError || !user) {
          router.push('/account/login')
          return
        }
        
        setUserEmail(user.email || '')
        
        // Get order - RLS policy will ensure user can only see their own orders
        const { data: orderData, error } = await supabaseCustomer
          .from('orders')
          .select(`
            *,
            order_items(
              id,
              quantity,
              unit_price,
              subtotal,
              product_id,
              product_snapshot
            )
          `)
          .eq('id', orderId)
          .single()
        
        if (error) {
          console.error('[ORDER DETAIL] Error fetching order:', error)
          setNotFound(true)
          setLoading(false)
          return
        }
        
        if (!orderData) {
          setNotFound(true)
          setLoading(false)
          return
        }
        
        setOrder(orderData)
        setLoading(false)
      } catch (error) {
        console.error('[ORDER DETAIL] Unexpected error:', error)
        setNotFound(true)
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cargando pedido...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600 mb-6">Pedido no encontrado</p>
          <Link
            href="/account/orders"
            className="inline-block bg-[#FF69B4] text-white px-6 py-3 hover:bg-[#FF69B4]/90 transition-colors"
          >
            ← Volver a mis pedidos
          </Link>
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }
  
  const statusInfo = getStatusInfo(order.status)
  const shippingStatusInfo = getShippingStatusInfo(order.shipping_status)

  return (
    <AccountLayout userEmail={userEmail}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#FF69B4] transition-colors mb-4"
          >
            ← Volver a mis pedidos
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-[family-name:var(--font-playfair)] text-3xl text-gray-900 mb-2">
                Pedido #{order.id.slice(0, 8)}
              </h1>
              <p className="text-gray-600">
                Realizado el {new Date(order.created_at).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
        
        {/* Status Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{statusInfo.emoji}</span>
            <div className="flex-1">
              <h2 className={`text-xl font-medium ${statusInfo.color} mb-1`}>
                {statusInfo.title}
              </h2>
              <p className="text-gray-600">
                {statusInfo.description}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estado del pago</h3>
          
          <div className="flex items-center gap-3">
            <span className={`text-sm px-3 py-1.5 rounded border ${
              order.payment_status === 'paid' 
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                : 'bg-yellow-100 text-yellow-700 border-yellow-200'
            }`}>
              {order.payment_status === 'paid' ? '✓ Pagado' : '⏳ Pendiente'}
            </span>
            
            {order.payment_status === 'paid' && (
              <p className="text-sm text-gray-600">
                Pago procesado correctamente
              </p>
            )}
          </div>
        </div>

        {/* Shipping Status */}
        <div className={`border rounded-lg p-6 mb-6 ${shippingStatusInfo.bgColor} ${shippingStatusInfo.borderColor}`}>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estado de envío</h3>
          
          <div className="flex items-start gap-4 mb-4">
            <span className="text-3xl">{shippingStatusInfo.emoji}</span>
            <div className="flex-1">
              <h4 className={`font-medium mb-1 ${shippingStatusInfo.color}`}>
                {shippingStatusInfo.title}
              </h4>
              <p className="text-sm text-gray-700">
                {shippingStatusInfo.description}
              </p>
            </div>
          </div>

          {/* Shipping Details */}
          <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
            {order.shipping_provider ? (
              <div>
                <p className="text-sm text-gray-600 mb-1">Paquetería</p>
                <p className="text-gray-900 font-medium">
                  {order.shipping_provider === 'dhl' ? 'DHL Express' :
                   order.shipping_provider === 'fedex' ? 'FedEx' :
                   order.shipping_provider}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600">Paquetería pendiente</p>
              </div>
            )}
            
            {order.tracking_number ? (
              <div>
                <p className="text-sm text-gray-600 mb-1">Número de rastreo</p>
                <p className="font-mono text-gray-900">{order.tracking_number}</p>
              </div>
            ) : order.shipping_status === 'shipped' ? (
              <div>
                <p className="text-sm text-gray-600">Tracking pendiente</p>
              </div>
            ) : null}
            
            {(order.tracking_token || order.tracking_url) && (
              <div className="flex gap-3 pt-2">
                {order.tracking_token && (
                  <Link
                    href={`/track/${order.tracking_token}`}
                    className="inline-block bg-[#FF69B4] text-white px-6 py-2 text-sm hover:bg-[#FF69B4]/90 transition-colors"
                  >
                    Ver seguimiento completo
                  </Link>
                )}
                
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block border border-gray-300 text-gray-700 px-6 py-2 text-sm hover:border-[#FF69B4] hover:text-[#FF69B4] transition-colors"
                  >
                    Rastrear en {order.shipping_provider === 'dhl' ? 'DHL' : order.shipping_provider === 'fedex' ? 'FedEx' : 'paquetería'} →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Timeline */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Progreso del pedido</h3>
          <OrderTimeline order={order} />
        </div>
        
        {/* Products */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Productos</h3>
          
          <div className="space-y-4">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {item.product_snapshot?.brand} {item.product_snapshot?.title}
                  </p>
                  {item.product_snapshot?.model && (
                    <p className="text-sm text-gray-600 mt-1">
                      Modelo: {item.product_snapshot.model}
                    </p>
                  )}
                  {item.product_snapshot?.color && (
                    <p className="text-sm text-gray-600">
                      Color: {item.product_snapshot.color}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Cantidad: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    ${item.unit_price.toLocaleString()} MXN
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Subtotal: ${item.subtotal.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">${order.subtotal.toLocaleString()} MXN</span>
            </div>
            {order.shipping > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Envío</span>
                <span className="text-gray-900">${order.shipping.toLocaleString()} MXN</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-medium pt-2 border-t border-gray-200">
              <span className="text-gray-900">Total</span>
              <span className="text-[#FF69B4]">${order.total.toLocaleString()} MXN</span>
            </div>
          </div>
        </div>
        
        {/* Shipping Address */}
        <ShippingAddressSection 
          order={order} 
          autoExpand={action === 'confirm-shipping'}
        />
      </div>
    </AccountLayout>
  )
}
