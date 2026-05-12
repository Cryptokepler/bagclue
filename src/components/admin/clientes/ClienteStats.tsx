'use client'

import type { ClienteStats as ClienteStatsType } from '@/types/admin-clientes'

interface Props {
  stats: ClienteStatsType
}

export default function ClienteStats({ stats }: Props) {
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
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Total comprado */}
      <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
        <div className="text-2xl font-bold text-emerald-400 mb-1">
          {formatCurrency(stats.total_spent)}
        </div>
        <div className="text-sm text-gray-400">Total comprado</div>
      </div>

      {/* # Pedidos */}
      <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
        <div className="text-3xl font-bold text-white mb-1">
          {stats.total_orders}
        </div>
        <div className="text-sm text-gray-400"># Pedidos</div>
      </div>

      {/* # Apartados */}
      <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
        <div className="text-3xl font-bold text-blue-400 mb-1">
          {stats.total_layaways}
        </div>
        <div className="text-sm text-gray-400"># Apartados</div>
      </div>

      {/* Saldo pendiente */}
      <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
        <div className="text-2xl font-bold text-yellow-400 mb-1">
          {formatCurrency(stats.balance_due)}
        </div>
        <div className="text-sm text-gray-400">Saldo pendiente</div>
      </div>

      {/* Pagos en revisión */}
      <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
        <div className="text-3xl font-bold text-[#FF69B4] mb-1">
          {stats.payments_under_review}
        </div>
        <div className="text-sm text-gray-400">Pagos en revisión</div>
      </div>

      {/* Última compra */}
      <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
        <div className="text-sm font-bold text-white mb-1">
          {formatDate(stats.last_purchase_at)}
        </div>
        <div className="text-sm text-gray-400">Última compra</div>
      </div>
    </div>
  )
}
