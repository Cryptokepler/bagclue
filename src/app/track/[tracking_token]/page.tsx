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

  const statusLabel = getStatusLabel(order.shipping_status)
  const statusIcon = getStatusIcon(order.shipping_status)

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

        {/* Status Badge */}
        <div className="bg-white border border-[#FF69B4]/10 p-6 mb-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Estado del pedido</p>
          <p className="text-2xl font-medium text-gray-900">
            {statusIcon} {statusLabel}
          </p>
        </div>

        {/* Products */}
        <div className="bg-white border border-[#FF69B4]/10 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Productos</h2>
          
          {items.map((item: any, index: number) => (
            <div key={index} className="flex gap-4 mb-4 last:mb-0">
              {item.product_image && (
                <div className="w-20 h-20 bg-gray-100 flex-shrink-0">
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
                <p className="text-sm text-gray-600">
                  {formatPrice(item.unit_price)}
                </p>
              </div>
            </div>
          ))}
          
          <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-lg font-medium text-gray-900">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping Info */}
        {(order.shipping_provider || order.tracking_number || order.shipping_address) && (
          <div className="bg-white border border-[#FF69B4]/10 p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Información de envío</h2>
            
            {order.shipping_provider && (
              <div className="mb-3">
                <p className="text-sm text-gray-600">Paquetería</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.shipping_provider === 'dhl' ? 'DHL Express' : 'FedEx'}
                </p>
              </div>
            )}
            
            {order.tracking_number && (
              <div className="mb-3">
                <p className="text-sm text-gray-600">Número de rastreo</p>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  {order.tracking_number}
                </p>
                {order.tracking_url && (
                  <a 
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm text-[#FF69B4] hover:underline"
                  >
                    Ver en {order.shipping_provider === 'dhl' ? 'DHL' : 'FedEx'} →
                  </a>
                )}
              </div>
            )}
            
            {order.shipping_address && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Se enviará a:</p>
                <p className="text-sm text-gray-900 whitespace-pre-line">
                  {order.shipping_address}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white border border-[#FF69B4]/10 p-6 mb-6">
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
    case 'pending': return 'Pendiente de envío'
    case 'preparing': return 'Preparando envío'
    case 'shipped': return 'En camino'
    case 'delivered': return 'Entregado'
    default: return 'Procesando'
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'pending': return '⏳'
    case 'preparing': return '📦'
    case 'shipped': return '🚚'
    case 'delivered': return '✅'
    default: return '🔄'
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}
