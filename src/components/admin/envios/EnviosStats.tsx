'use client'

import { EnviosStats as StatsType } from '@/types/admin-envios'

interface EnviosStatsProps {
  stats: StatsType
  loading?: boolean
}

export default function EnviosStats({ stats, loading }: EnviosStatsProps) {
  const statCards = [
    {
      label: 'Pendiente Dirección',
      value: stats.pending_address,
      key: 'pending_address',
      color: 'bg-white/5 border-yellow-500/30 text-yellow-400'
    },
    {
      label: 'Pendiente Envío',
      value: stats.pending_shipment,
      key: 'pending_shipment',
      color: 'bg-white/5 border-orange-500/30 text-orange-400'
    },
    {
      label: 'Preparando',
      value: stats.preparing,
      key: 'preparing',
      color: 'bg-white/5 border-blue-500/30 text-blue-400'
    },
    {
      label: 'Enviados',
      value: stats.shipped,
      key: 'shipped',
      color: 'bg-white/5 border-purple-500/30 text-purple-400'
    },
    {
      label: 'Entregados',
      value: stats.delivered,
      key: 'delivered',
      color: 'bg-white/5 border-emerald-500/30 text-emerald-400'
    },
    {
      label: 'Total',
      value: stats.total,
      key: 'total',
      color: 'bg-white/5 border-[#FF69B4]/20 text-white'
    }
  ]

  if (loading) {
    return (
      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-white/5 border border-[#FF69B4]/20 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(card => (
          <div
            key={card.key}
            className={`${card.color} border p-4 transition-all hover:bg-white/10`}
          >
            <div className="text-xs text-gray-400">{card.label}</div>
            <div className="text-2xl font-bold mt-1">{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
