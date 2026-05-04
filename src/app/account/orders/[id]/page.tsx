'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AccountLayout from '@/components/customer/AccountLayout'
import OrderTimeline from '@/components/OrderTimeline'
import ShippingAddressSection from '@/components/customer/ShippingAddressSection'
import { supabaseCustomer } from '@/lib/supabase-customer'

function getOrderPipelineState(order: any): {
  state: 'payment_pending' | 'no_address' | 'address_confirmed' | 'preparing' | 'shipped' | 'delivered'
  title: string
  emoji: string
  message: string
  color: string
  bgColor: string
  borderColor: string
  primaryCTA: { label: string; action: 'confirm-address' | 'track' | 'catalog' } | null
  secondaryCTA: { label: string; action: 'view-address' | 'catalog' } | null
  showTrackingInfo: boolean
} {
  // Estado F: Entregado
  if (order.shipping_status === 'delivered') {
    return {
      state: 'delivered',
      title: 'Pedido entregado',
      emoji: '✅',
      message: 'Tu pieza fue entregada correctamente. ¡Esperamos que la disfrutes!',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      primaryCTA: null,
      secondaryCTA: {
        label: 'Ver más piezas de lujo',
        action: 'catalog'
      },
      showTrackingInfo: true
    }
  }
  
  // Estado E: Enviado
  if (order.shipping_status === 'shipped') {
    const hasTracking = order.tracking_number || order.tracking_url || order.tracking_token
    
    return {
      state: 'shipped',
      title: 'Tu pedido va en camino',
      emoji: '🚚',
      message: hasTracking 
        ? 'Tu pieza fue enviada y está en tránsito. Puedes rastrear tu paquete en tiempo real.'
        : 'Tu pedido fue enviado. El número de rastreo estará disponible pronto.',
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      primaryCTA: hasTracking ? {
        label: '🚚 Rastrear mi paquete',
        action: 'track'
      } : null,
      secondaryCTA: null,
      showTrackingInfo: true
    }
  }
  
  // Estado D: Preparando
  if (order.shipping_status === 'preparing') {
    return {
      state: 'preparing',
      title: 'Preparando tu pieza',
      emoji: '📦',
      message: 'Estamos verificando y preparando tu pedido para enviarlo. Pronto recibirás información de rastreo.',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      primaryCTA: null,
      secondaryCTA: null,
      showTrackingInfo: false
    }
  }
  
  // Estado C: Dirección confirmada + pending
  if (order.shipping_address && order.payment_status === 'paid' && (!order.shipping_status || order.shipping_status === 'pending')) {
    return {
      state: 'address_confirmed',
      title: 'Dirección confirmada',
      emoji: '✅',
      message: 'Nuestro equipo preparará tu pieza para envío. Te notificaremos cuando esté lista.',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      primaryCTA: null,
      secondaryCTA: {
        label: 'Ver mi dirección de envío',
        action: 'view-address'
      },
      showTrackingInfo: false
    }
  }
  
  // Estado B: Pagado sin dirección
  if (!order.shipping_address && order.payment_status === 'paid') {
    return {
      state: 'no_address',
      title: 'Tu compra está confirmada',
      emoji: '✅',
      message: 'Confirma tu dirección de envío para que podamos preparar tu paquete.',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      primaryCTA: {
        label: '📍 Confirmar dirección de envío',
        action: 'confirm-address'
      },
      secondaryCTA: null,
      showTrackingInfo: false
    }
  }
  
  // Estado A: Pago pendiente
  if (order.payment_status !== 'paid') {
    return {
      state: 'payment_pending',
      title: 'Esperando pago',
      emoji: '⏳',
      message: 'Tu pedido se actualizará cuando el pago sea confirmado.',
      color: 'text-gray-700',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      primaryCTA: null,
      secondaryCTA: null,
      showTrackingInfo: false
    }
  }
  
  // Fallback
  return {
    state: 'payment_pending',
    title: 'Procesando pedido',
    emoji: '⏳',
    message: 'Estamos procesando tu pedido.',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    primaryCTA: null,
    secondaryCTA: null,
    showTrackingInfo: false
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
  
  const pipelineState = getOrderPipelineState(order)

  const handleCTAClick = (action: 'confirm-address' | 'track' | 'catalog' | 'view-address') => {
    if (action === 'confirm-address' || action === 'view-address') {
      // Scroll to shipping address section
      const section = document.getElementById('shipping-address-section')
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else if (action === 'track') {
      // Navigate to tracking
      if (order.tracking_token) {
        router.push(`/track/${order.tracking_token}`)
      } else if (order.tracking_url) {
        window.open(order.tracking_url, '_blank')
      }
    } else if (action === 'catalog') {
      router.push('/catalogo')
    }
  }

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
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-[family-name:var(--font-playfair)] text-3xl text-gray-900">
                  Pedido
                </h1>
                <span className="font-mono text-sm uppercase bg-gray-100 border border-gray-300 rounded-md px-2 py-1 text-gray-700">
                  #{order.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
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
        
        {/* Estado de tu pedido - Pipeline Card */}
        <div className={`border rounded-lg p-6 mb-6 ${pipelineState.bgColor} ${pipelineState.borderColor}`}>
          <div className="flex items-start gap-4 mb-4">
            <span className="text-4xl">{pipelineState.emoji}</span>
            <div className="flex-1">
              <h2 className={`text-xl font-medium ${pipelineState.color} mb-2`}>
                {pipelineState.title}
              </h2>
              <p className="text-gray-700">
                {pipelineState.message}
              </p>
            </div>
          </div>

          {/* CTAs */}
          {(pipelineState.primaryCTA || pipelineState.secondaryCTA) && (
            <div className="flex flex-wrap gap-3 mt-4">
              {pipelineState.primaryCTA && (
                <button
                  onClick={() => handleCTAClick(pipelineState.primaryCTA!.action)}
                  className="bg-[#FF69B4] text-white px-6 py-2.5 text-sm font-medium hover:bg-[#FF69B4]/90 transition-colors rounded"
                >
                  {pipelineState.primaryCTA.label}
                </button>
              )}
              
              {pipelineState.secondaryCTA && (
                <button
                  onClick={() => handleCTAClick(pipelineState.secondaryCTA!.action)}
                  className="border border-gray-300 text-gray-700 px-6 py-2.5 text-sm font-medium hover:border-[#FF69B4] hover:text-[#FF69B4] transition-colors rounded"
                >
                  {pipelineState.secondaryCTA.label}
                </button>
              )}
            </div>
          )}
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

        {/* Shipping Info - Only show if relevant */}
        {pipelineState.showTrackingInfo && (order.shipping_provider || order.tracking_number) && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información de envío</h3>
            
            <div className="space-y-3">
              {order.shipping_provider && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Paquetería</p>
                  <p className="text-gray-900 font-medium">
                    {order.shipping_provider === 'dhl' ? 'DHL Express' :
                     order.shipping_provider === 'fedex' ? 'FedEx' :
                     order.shipping_provider === 'manual' ? 'Otra paquetería' :
                     order.shipping_provider}
                  </p>
                </div>
              )}
              
              {order.tracking_number ? (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Número de rastreo</p>
                  <p className="font-mono text-gray-900 text-sm">{order.tracking_number}</p>
                </div>
              ) : order.shipping_status === 'shipped' ? (
                <div>
                  <p className="text-sm text-gray-600">Tracking pendiente</p>
                </div>
              ) : null}
              
              {order.tracking_url && (
                <div className="pt-2">
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[#FF69B4] hover:text-[#FF69B4]/80 transition-colors"
                  >
                    Rastrear en {order.shipping_provider === 'dhl' ? 'DHL' : order.shipping_provider === 'fedex' ? 'FedEx' : 'paquetería'} →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
        
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
        <div id="shipping-address-section">
          <ShippingAddressSection 
            order={order} 
            autoExpand={action === 'confirm-shipping'}
          />
        </div>
      </div>
    </AccountLayout>
  )
}
