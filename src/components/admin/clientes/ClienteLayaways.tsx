'use client'

import type { ClienteLayaway } from '@/types/admin-clientes'

interface Props {
  layaways: ClienteLayaway[]
}

export default function ClienteLayaways({ layaways }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string, label: string }> = {
      pending: { color: 'yellow', label: 'Pendiente' },
      active: { color: 'blue', label: 'Activo' },
      completed: { color: 'emerald', label: 'Completado' },
      cancelled: { color: 'gray', label: 'Cancelado' },
      forfeited: { color: 'red', label: 'Perdido' }
    }
    const badge = badges[status] || { color: 'gray', label: status }
    return (
      <span className={`px-2 py-1 text-xs bg-${badge.color}-500/20 text-${badge.color}-400 border border-${badge.color}-500/30`}>
        {badge.label}
      </span>
    )
  }

  if (layaways.length === 0) {
    return null
  }

  return (
    <div className="bg-white/5 border border-[#FF69B4]/20 mb-8">
      <div className="px-6 py-4 border-b border-[#FF69B4]/10">
        <h2 className="text-lg text-white font-medium">Apartados ({layaways.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Producto</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Pagado</th>
              <th className="px-6 py-3">Pendiente</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3">Próximo pago</th>
              <th className="px-6 py-3">Fecha</th>
              <th className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#FF69B4]/10">
            {layaways.map((layaway) => (
              <tr key={layaway.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                  {layaway.id.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {layaway.product_brand} {layaway.product_title || `Producto ${layaway.product_id.slice(0, 8)}`}
                </td>
                <td className="px-6 py-4 text-sm text-white font-medium">
                  {formatCurrency(layaway.total_amount)}
                </td>
                <td className="px-6 py-4 text-sm text-emerald-400">
                  {formatCurrency(layaway.amount_paid)}
                </td>
                <td className="px-6 py-4 text-sm text-yellow-400">
                  {formatCurrency(layaway.amount_remaining)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {getStatusBadge(layaway.status)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {layaway.status === 'active' && layaway.next_payment_due_date ? (
                    <div>
                      {formatDate(layaway.next_payment_due_date)}
                      {layaway.next_payment_amount && (
                        <div className="text-yellow-400">
                          {formatCurrency(layaway.next_payment_amount)}
                        </div>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {formatDate(layaway.created_at)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {layaway.layaway_token && (
                    <a
                      href={`/apartado/${layaway.layaway_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF69B4] hover:text-[#FF69B4]/80 transition-colors"
                    >
                      Ver
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
