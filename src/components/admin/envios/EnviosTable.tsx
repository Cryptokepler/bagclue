'use client'

import { EnviosOrder } from '@/types/admin-envios'
import { useState } from 'react'
import EnviosActions from './EnviosActions'

interface EnviosTableProps {
  orders: EnviosOrder[]
  loading?: boolean
  onOrderClick: (orderId: string) => void
  onActionComplete?: () => void
}

export default function EnviosTable({ orders, loading, onOrderClick, onActionComplete }: EnviosTableProps) {
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null)

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month} ${hours}:${minutes}`
  }

  const formatTotal = (amount: number, currency: string | null) => {
    const curr = currency || 'MXN'
    return `$${amount.toLocaleString('es-MX')} ${curr}`
  }

  const formatProductSummary = (order: EnviosOrder) => {
    if (!order.order_items || order.order_items.length === 0) {
      return 'Sin productos'
    }
    
    const summary = order.order_items
      .map(item => `${item.product_snapshot.brand} ${item.product_snapshot.title}`)
      .join(', ')
    
    return summary.length > 40 ? summary.slice(0, 37) + '...' : summary
  }

  const getPaymentBadge = (status: string) => {
    const badges = {
      paid: 'bg-emerald-500/20 text-emerald-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      refunded: 'bg-red-500/20 text-red-400'
    }
    const labels = {
      paid: 'Pagado',
      pending: 'Pendiente',
      refunded: 'Reembolsado'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${badges[status as keyof typeof badges] || 'bg-gray-500/20 text-gray-400'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const getShippingBadge = (status: string | null) => {
    if (!status || status === 'pending') {
      return <span className="px-2 py-1 text-xs font-medium rounded bg-gray-500/20 text-gray-400">Pendiente</span>
    }
    const badges = {
      preparing: 'bg-blue-500/20 text-blue-400',
      shipped: 'bg-purple-500/20 text-purple-400',
      delivered: 'bg-emerald-500/20 text-emerald-400'
    }
    const labels = {
      preparing: 'Preparando',
      shipped: 'Enviado',
      delivered: 'Entregado'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${badges[status as keyof typeof badges] || 'bg-gray-500/20 text-gray-400'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const getAddressBadge = (address: string | null) => {
    if (address) {
      return <span className="px-2 py-1 text-xs font-medium rounded bg-emerald-500/20 text-emerald-400">✅ Confirmada</span>
    }
    return <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-500/20 text-yellow-400">⚠️ Pendiente</span>
  }

  const handleCopyTracking = async (trackingNumber: string, orderId: string) => {
    try {
      await navigator.clipboard.writeText(trackingNumber)
      setCopiedTracking(orderId)
      setTimeout(() => setCopiedTracking(null), 2000)
    } catch (err) {
      console.error('Failed to copy tracking number:', err)
    }
  }

  const handleOpenTracking = (url: string) => {
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="bg-white/5 border border-[#FF69B4]/20 overflow-hidden">
        <div className="animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="p-4 border-b border-[#FF69B4]/10">
              <div className="h-16 bg-white/5 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white/5 border border-[#FF69B4]/20 p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-white">No hay órdenes</h3>
        <p className="mt-1 text-sm text-gray-400">No se encontraron órdenes con los filtros aplicados.</p>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-[#FF69B4]/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Producto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pago</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Dirección</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Envío</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tracking</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#FF69B4]/10">
            {orders.map(order => (
              <tr
                key={order.id}
                className="hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => onOrderClick(order.id)}
              >
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                  {formatDate(order.created_at)}
                </td>
                <td className="px-4 py-4 text-sm">
                  <div className="text-white font-medium">{order.customer_name}</div>
                  <div className="text-gray-400 text-xs">{order.customer_email}</div>
                  {order.customer_phone && (
                    <div className="text-gray-400 text-xs">{order.customer_phone}</div>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-gray-300">
                  <div className="max-w-xs truncate" title={formatProductSummary(order)}>
                    {formatProductSummary(order)}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-white font-medium">
                  {formatTotal(order.total, order.currency)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {getPaymentBadge(order.payment_status)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {getAddressBadge(order.shipping_address)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {getShippingBadge(order.shipping_status)}
                </td>
                <td className="px-4 py-4 text-sm">
                  {order.tracking_number ? (
                    <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                      <span className="text-gray-300 font-mono text-xs">{order.tracking_number}</span>
                      <button
                        onClick={() => handleCopyTracking(order.tracking_number!, order.id)}
                        className="text-gray-400 hover:text-[#FF69B4]"
                        title="Copiar tracking"
                      >
                        {copiedTracking === order.id ? (
                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                      {order.tracking_url && (
                        <button
                          onClick={() => handleOpenTracking(order.tracking_url!)}
                          className="text-[#FF69B4] hover:text-[#FF69B4]/80"
                          title="Abrir tracking"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm" onClick={e => e.stopPropagation()}>
                  <EnviosActions order={order} onActionComplete={onActionComplete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
