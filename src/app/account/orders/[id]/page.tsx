import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AccountLayout from '@/components/customer/AccountLayout'
import OrderTimeline from '@/components/OrderTimeline'
import { supabaseCustomer } from '@/lib/supabase-customer'

async function getOrder(orderId: string) {
  try {
    const { data: { user }, error: userError } = await supabaseCustomer.auth.getUser()
    
    if (userError || !user) {
      return null
    }
    
    // Get order - RLS policy will ensure user can only see their own orders
    const { data: order, error } = await supabaseCustomer
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
      return null
    }
    
    return order
  } catch (error) {
    console.error('[ORDER DETAIL] Unexpected error:', error)
    return null
  }
}

function getStatusInfo(status: string, shipping_status?: string) {
  if (status === 'cancelled') {
    return {
      emoji: '❌',
      title: 'Pedido cancelado',
      description: 'Este pedido fue cancelado. Si tienes dudas, contáctanos.',
      color: 'text-red-600'
    }
  }
  
  if (status === 'delivered' || shipping_status === 'delivered') {
    return {
      emoji: '✅',
      title: 'Pedido entregado',
      description: 'Tu pedido ya fue entregado. ¡Disfruta tu nueva pieza!',
      color: 'text-emerald-600'
    }
  }
  
  if (shipping_status === 'shipped' || status === 'shipped') {
    return {
      emoji: '🚚',
      title: 'Pedido en camino',
      description: 'Tu pedido está en tránsito. Revisa el rastreo para seguirlo.',
      color: 'text-blue-600'
    }
  }
  
  if (shipping_status === 'preparing' || status === 'preparing') {
    return {
      emoji: '📦',
      title: 'Preparando tu pedido',
      description: 'Estamos preparando tu pedido con mucho cuidado.',
      color: 'text-purple-600'
    }
  }
  
  if (status === 'confirmed') {
    return {
      emoji: '✓',
      title: 'Pago confirmado',
      description: 'Tu pago fue confirmado. Prepararemos tu pedido pronto.',
      color: 'text-emerald-600'
    }
  }
  
  return {
    emoji: '⏳',
    title: 'Procesando pedido',
    description: 'Estamos procesando tu pedido. Te notificaremos cuando esté listo.',
    color: 'text-gray-600'
  }
}

export default async function OrderDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { data: { user } } = await supabaseCustomer.auth.getUser()
  
  if (!user) {
    redirect('/account/login')
  }
  
  const { id } = await params
  const order = await getOrder(id)
  
  if (!order) {
    notFound()
  }
  
  const statusInfo = getStatusInfo(order.status, order.shipping_status)

  return (
    <AccountLayout>
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
        
        {/* Shipping Info */}
        {(order.shipping_address || order.tracking_number) && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información de envío</h3>
            
            {order.shipping_address && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Dirección de envío</p>
                <p className="text-gray-900 whitespace-pre-line">{order.shipping_address}</p>
              </div>
            )}
            
            {order.shipping_provider && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-1">Paquetería</p>
                <p className="text-gray-900 font-medium">
                  {order.shipping_provider === 'dhl' ? 'DHL Express' :
                   order.shipping_provider === 'fedex' ? 'FedEx' :
                   order.shipping_provider}
                </p>
              </div>
            )}
            
            {order.tracking_number && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Número de rastreo</p>
                <p className="font-mono text-gray-900 mb-3">{order.tracking_number}</p>
                
                <div className="flex gap-3">
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
              </div>
            )}
          </div>
        )}
        
        {/* Payment Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
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
      </div>
    </AccountLayout>
  )
}
