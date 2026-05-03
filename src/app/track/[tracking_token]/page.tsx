import { notFound } from 'next/navigation'
import Link from 'next/link'
import OrderTimeline from '@/components/OrderTimeline'
import { formatPrice } from '@/data/products'

export const dynamic = 'force-dynamic'

async function getOrderByToken(token: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bagclue.vercel.app'
    const response = await fetch(`${baseUrl}/api/orders/track/${token}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) return null
    
    return await response.json()
  } catch (error) {
    console.error('[TRACK PAGE] Error:', error)
    return null
  }
}

function getOrderStatusMessage(status: string, shipping_status?: string): { emoji: string, title: string, message: string } {
  if (status === 'cancelled') {
    return {
      emoji: '❌',
      title: 'Pedido cancelado',
      message: 'Este pedido fue cancelado. Si tienes dudas, contáctanos por WhatsApp.'
    }
  }

  if (status === 'delivered' || shipping_status === 'delivered') {
    return {
      emoji: '✅',
      title: '¡Pedido entregado!',
      message: 'Tu pedido ya fue entregado. Esperamos que disfrutes tu nueva pieza de lujo.'
    }
  }

  if (shipping_status === 'shipped') {
    return {
      emoji: '🚚',
      title: 'Tu pedido fue enviado',
      message: 'Tu pedido está en camino. Revisa el número de rastreo para seguir el envío.'
    }
  }

  if (shipping_status === 'preparing' || status === 'preparing') {
    return {
      emoji: '📦',
      title: 'Preparando tu pedido',
      message: 'Estamos preparando tu pieza de lujo con mucho cuidado. Pronto la tendrás.'
    }
  }

  if (status === 'confirmed') {
    return {
      emoji: '✓',
      title: 'Pago confirmado',
      message: 'Tu pago fue confirmado. Estamos preparando tu pieza.'
    }
  }

  return {
    emoji: '⏳',
    title: 'Procesando pedido',
    message: 'Estamos procesando tu pedido. Te notificaremos cuando esté listo.'
  }
}

export default async function TrackOrderPage({ 
  params 
}: { 
  params: Promise<{ tracking_token: string }> 
}) {
  const { tracking_token } = await params
  
  const data = await getOrderByToken(tracking_token)
  
  if (!data || !data.order) {
    notFound()
  }

  const { order, items } = data

  const statusInfo = getOrderStatusMessage(order.status, order.shipping_status)

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-24">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl text-gray-900 mb-2">
            Seguimiento de Pedido
          </h1>
          <p className="text-sm text-gray-600">
            Pedido #{order.id.slice(0, 8)} • {formatDate(order.created_at)}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white border border-[#FF69B4]/10 p-6 mb-6 text-center">
          <p className="text-4xl mb-3">{statusInfo.emoji}</p>
          <h2 className="text-xl font-medium text-gray-900 mb-2">{statusInfo.title}</h2>
          <p className="text-sm text-gray-600">{statusInfo.message}</p>
        </div>

        {/* Orden Info */}
        <div className="bg-white border border-[#FF69B4]/10 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Información del Pedido</h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Número de orden</span>
              <span className="font-mono text-gray-900">#{order.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Fecha de compra</span>
              <span className="text-gray-900">{formatDate(order.created_at)}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Estado del pago</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                order.payment_status === 'paid' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estado del pedido</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                order.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white border border-[#FF69B4]/10 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Datos del Cliente</h2>
          
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-600 text-xs mb-1">Nombre</p>
              <p className="text-gray-900">{order.customer_name}</p>
            </div>
            {order.customer_phone && (
              <div>
                <p className="text-gray-600 text-xs mb-1">Teléfono</p>
                <p className="text-gray-900">{order.customer_phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Products */}
        <div className="bg-white border border-[#FF69B4]/10 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Productos</h2>
          
          {items.map((item: any, index: number) => (
            <div key={index} className="flex gap-4 mb-4 last:mb-0 pb-4 last:pb-0 border-b last:border-0 border-gray-100">
              {item.product_image && (
                <div className="w-20 h-20 bg-gray-100 flex-shrink-0 overflow-hidden">
                  <img 
                    src={item.product_image} 
                    alt={item.product_title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {item.product_brand} {item.product_title}
                </p>
                {item.product_snapshot?.model && (
                  <p className="text-xs text-gray-600 mt-1">
                    Modelo: {item.product_snapshot.model}
                  </p>
                )}
                {item.product_snapshot?.color && (
                  <p className="text-xs text-gray-600">
                    Color: {item.product_snapshot.color}
                  </p>
                )}
                <p className="text-sm text-[#FF69B4] mt-2">
                  {formatPrice(item.unit_price)}
                </p>
              </div>
            </div>
          ))}
          
          <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-sm text-gray-900">{formatPrice(order.subtotal || order.total)}</span>
            </div>
            {order.shipping > 0 && (
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Envío</span>
                <span className="text-sm text-gray-900">{formatPrice(order.shipping)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-lg font-medium text-gray-900">Total pagado</span>
              <span className="text-lg font-medium text-[#FF69B4]">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping Info */}
        {(order.shipping_provider || order.tracking_number || order.shipping_address) && (
          <div className="bg-white border border-[#FF69B4]/10 p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Información de Envío</h2>
            
            {order.shipping_address && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Se enviará a:</p>
                <p className="text-sm text-gray-900 whitespace-pre-line">
                  {order.shipping_address}
                </p>
              </div>
            )}

            {order.shipping_provider && (
              <div className="mb-3">
                <p className="text-sm text-gray-600">Paquetería</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.shipping_provider === 'dhl' ? 'DHL Express' : 
                   order.shipping_provider === 'fedex' ? 'FedEx' :
                   'Mensajería'}
                </p>
              </div>
            )}
            
            {order.tracking_number && (
              <div className="mb-3">
                <p className="text-sm text-gray-600">Número de rastreo</p>
                <p className="text-sm font-mono text-gray-900 mb-2">
                  {order.tracking_number}
                </p>
                {order.tracking_url && (
                  <a 
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-[#FF69B4] text-white px-6 py-2 text-sm hover:bg-[#FF69B4]/90 transition-colors"
                  >
                    Rastrear envío en {order.shipping_provider === 'dhl' ? 'DHL' : order.shipping_provider === 'fedex' ? 'FedEx' : 'paquetería'} →
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white border border-[#FF69B4]/10 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Progreso del Pedido</h2>
          <OrderTimeline order={order} />
        </div>

        {/* Support */}
        <div className="bg-[#FF69B4]/5 border border-[#FF69B4]/20 p-6 mb-6">
          <p className="text-sm text-gray-900 mb-3">¿Dudas sobre tu pedido?</p>
          <div className="space-y-2 text-sm">
            <p className="text-gray-700">
              📷 Instagram: <a href="https://instagram.com/bagclue" target="_blank" className="text-[#FF69B4] hover:underline">@bagclue</a>
            </p>
            <p className="text-gray-700">
              💬 WhatsApp: <a href="https://wa.me/525512345678" target="_blank" className="text-[#FF69B4] hover:underline">+52 55 1234 5678</a>
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex gap-4 justify-center">
          <Link 
            href="/catalogo"
            className="border border-[#FF69B4]/20 text-gray-900 px-8 py-3 hover:border-[#FF69B4] transition-colors"
          >
            Ver catálogo
          </Link>
          <Link 
            href="/"
            className="bg-[#FF69B4] text-white px-8 py-3 hover:bg-[#FF69B4]/90 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Pendiente'
    case 'confirmed': return 'Confirmado'
    case 'preparing': return 'Preparando'
    case 'shipped': return 'Enviado'
    case 'delivered': return 'Entregado'
    case 'cancelled': return 'Cancelado'
    default: return 'Procesando'
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}
