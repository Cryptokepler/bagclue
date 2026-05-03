interface TimelineEvent {
  status: 'completed' | 'current' | 'pending'
  label: string
  icon: string
  date?: string
  description?: string
  color: string
}

interface OrderTimelineProps {
  order: {
    created_at: string
    shipping_status: string
    shipped_at?: string | null
    delivered_at?: string | null
    tracking_number?: string | null
  }
}

export default function OrderTimeline({ order }: OrderTimelineProps) {
  const events: TimelineEvent[] = []

  // 1. Pago confirmado (siempre completed)
  events.push({
    status: 'completed',
    label: 'Pago confirmado',
    icon: '✅',
    date: formatDate(order.created_at),
    color: 'text-emerald-500'
  })

  // 2. Preparando envío
  const isPreparing = ['preparing', 'shipped', 'delivered'].includes(order.shipping_status)
  events.push({
    status: isPreparing ? 'completed' : order.shipping_status === 'pending' ? 'current' : 'pending',
    label: 'Preparando envío',
    icon: isPreparing ? '✅' : order.shipping_status === 'pending' ? '🔄' : '⏸️',
    date: isPreparing ? 'Preparado' : undefined,
    color: isPreparing ? 'text-blue-500' : 'text-gray-400'
  })

  // 3. Enviado
  const isShipped = ['shipped', 'delivered'].includes(order.shipping_status)
  events.push({
    status: isShipped ? 'completed' : order.shipping_status === 'preparing' ? 'current' : 'pending',
    label: 'Enviado',
    icon: isShipped ? '✅' : order.shipping_status === 'preparing' ? '🔄' : '⏸️',
    date: isShipped && order.shipped_at ? formatDate(order.shipped_at) : undefined,
    description: isShipped && order.tracking_number ? `Guía: ${order.tracking_number}` : undefined,
    color: isShipped ? 'text-purple-500' : 'text-gray-400'
  })

  // 4. Entregado
  const isDelivered = order.shipping_status === 'delivered'
  events.push({
    status: isDelivered ? 'completed' : isShipped && !isDelivered ? 'current' : 'pending',
    label: 'Entregado',
    icon: isDelivered ? '✅' : isShipped && !isDelivered ? '🔄' : '⏸️',
    date: isDelivered && order.delivered_at ? formatDate(order.delivered_at) : undefined,
    description: !isDelivered && isShipped ? 'En camino' : undefined,
    color: isDelivered ? 'text-emerald-500' : 'text-gray-400'
  })

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline del pedido</h3>
      
      {events.map((event, index) => (
        <div key={index} className="flex gap-4">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${
            event.status === 'completed' 
              ? 'border-emerald-500 bg-emerald-50' 
              : event.status === 'current'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50'
          }`}>
            <span className="text-lg">{event.icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 pb-6">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${
                event.status === 'completed' || event.status === 'current'
                  ? event.color
                  : 'text-gray-400'
              }`}>
                {event.label}
              </span>
              {event.date && (
                <span className="text-xs text-gray-500">
                  {event.date}
                </span>
              )}
            </div>
            {event.description && (
              <p className="text-sm text-gray-600 mt-1">
                {event.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${date.getDate()} ${months[date.getMonth()]}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
