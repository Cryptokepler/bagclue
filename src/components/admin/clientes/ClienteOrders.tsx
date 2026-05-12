'use client'

import Link from 'next/link'
import type { ClienteOrder } from '@/types/admin-clientes'

interface Props {
  orders: ClienteOrder[]
}

export default function ClienteOrders({ orders }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string, label: string }> = {
      pending: { color: 'yellow', label: 'Pendiente' },
      confirmed: { color: 'emerald', label: 'Confirmada' },
      cancelled: { color: 'gray', label: 'Cancelada' }
    }
    const badge = badges[status] || { color: 'gray', label: status }
    return (
      <span className={`px-2 py-1 text-xs bg-${badge.color}-500/20 text-${badge.color}-400 border border-${badge.color}-500/30`}>
        {badge.label}
      </span>
    )
  }

  const getPaymentStatusBadge = (status: string) => {
    const badges: Record<string, { color: string, label: string }> = {
      pending: { color: 'yellow', label: 'Pendiente' },
      paid: { color: 'emerald', label: 'Pagado' },
      failed: { color: 'red', label: 'Fallido' },
      refunded: { color: 'gray', label: 'Reembolsado' }
    }
    const badge = badges[status] || { color: 'gray', label: status }
    return (
      <span className={`px-2 py-1 text-xs bg-${badge.color}-500/20 text-${badge.color}-400 border border-${badge.color}-500/30`}>
        {badge.label}
      </span>
    )
  }

  const getShippingStatusBadge = (status: string) => {
    const badges: Record<string, { color: string, label: string }> = {
      pending: { color: 'yellow', label: 'Pendiente' },
      preparing: { color: 'blue', label: 'Preparando' },
      shipped: { color: 'purple', label: 'Enviado' },
      delivered: { color: 'emerald', label: 'Entregado' }
    }
    const badge = badges[status] || { color: 'gray', label: status }
    return (
      <span className={`px-2 py-1 text-xs bg-${badge.color}-500/20 text-${badge.color}-400 border border-${badge.color}-500/30`}>
        {badge.label}
      </span>
    )
  }

  return (
    <div className="bg-white/5 border border-[#FF69B4]/20 mb-8">
      <div className="px-6 py-4 border-b border-[#FF69B4]/10">
        <h2 className="text-lg text-white font-medium">Pedidos ({orders.length})</h2>
      </div>
      <div className="overflow-x-auto">
        {orders.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400">
            No hay pedidos todavía
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-white/5">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Productos</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Pago</th>
                <th className="px-6 py-3">Envío</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FF69B4]/10">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {order.items.length > 0 ? (
                      <div>
                        {order.items.map((item, idx) => (
                          <div key={idx}>
                            {item.product_brand} {item.product_title} (x{item.quantity})
                          </div>
                        ))}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-white font-medium">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getPaymentStatusBadge(order.payment_status)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getShippingStatusBadge(order.shipping_status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-[#FF69B4] hover:text-[#FF69B4]/80 transition-colors"
                      >
                        Ver
                      </Link>
                      {order.tracking_token && (
                        <a
                          href={`/track/${order.tracking_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Tracking
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
