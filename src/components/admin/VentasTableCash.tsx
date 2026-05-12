import Link from 'next/link'

type Order = {
  id: string
  created_at: string
  customer_name: string
  customer_email: string
  total: number
  payment_status: string
  payment_method?: string
  shipping_status: string
  order_items?: Array<{
    products?: {
      title: string
      brand: string
    }
  }>
}

type VentasTableCashProps = {
  orders: Order[]
  showHeader?: boolean
}

export default function VentasTableCash({ orders, showHeader = true }: VentasTableCashProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const getPaymentStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      paid: 'Pagada',
      pending: 'Pendiente',
      under_review: 'En revisión',
      failed: 'Fallida'
    }
    return map[status] || status
  }
  
  const getShippingStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending_address: 'Pendiente',
      pending_shipment: 'Pendiente',
      preparing: 'Preparando',
      shipped: 'Enviada',
      delivered: 'Entregada'
    }
    return map[status] || status
  }
  
  const getPaymentMethodLabel = (method?: string) => {
    const map: Record<string, string> = {
      stripe: 'Stripe',
      bank_transfer: 'Transferencia',
      cash: 'Efectivo'
    }
    return method ? (map[method] || method) : '-'
  }
  
  return (
    <div className="bg-white/5 border border-[#FF69B4]/20 mb-6">
      {showHeader && (
        <div className="px-6 py-4 border-b border-[#FF69B4]/10">
          <h2 className="text-lg text-white font-medium">Ventas Contado</h2>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
              <th className="px-6 py-3">Fecha</th>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Producto(s)</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Método pago</th>
              <th className="px-6 py-3">Estado pago</th>
              <th className="px-6 py-3">Estado envío</th>
              <th className="px-6 py-3">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#FF69B4]/10">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-400">
                  No hay ventas contado
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {formatDate(order.created_at)}
                    <div className="text-gray-500">
                      {formatTime(order.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white text-sm">{order.customer_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-400 text-xs">{order.customer_email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-300 text-sm">
                      {order.order_items && order.order_items.length > 0 ? (
                        order.order_items.map((item, idx) => (
                          <div key={idx} className="truncate max-w-[200px]">
                            {item.products?.brand} {item.products?.title}
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    ${order.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {getPaymentMethodLabel(order.payment_method)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 text-xs rounded ${
                      order.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                      order.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      order.payment_status === 'under_review' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {getPaymentStatusLabel(order.payment_status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 text-xs rounded ${
                      order.shipping_status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' :
                      order.shipping_status === 'shipped' ? 'bg-blue-500/20 text-blue-400' :
                      order.shipping_status === 'preparing' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {getShippingStatusLabel(order.shipping_status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-[#FF69B4] hover:text-[#FF69B4]/80 text-sm transition-colors"
                    >
                      Ver pedido →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
