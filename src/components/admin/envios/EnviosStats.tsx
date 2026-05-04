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
      color: 'bg-yellow-50 border-yellow-200 text-yellow-900'
    },
    {
      label: 'Pendiente Envío',
      value: stats.pending_shipment,
      key: 'pending_shipment',
      color: 'bg-orange-50 border-orange-200 text-orange-900'
    },
    {
      label: 'Preparando',
      value: stats.preparing,
      key: 'preparing',
      color: 'bg-blue-50 border-blue-200 text-blue-900'
    },
    {
      label: 'Enviados',
      value: stats.shipped,
      key: 'shipped',
      color: 'bg-purple-50 border-purple-200 text-purple-900'
    },
    {
      label: 'Entregados',
      value: stats.delivered,
      key: 'delivered',
      color: 'bg-green-50 border-green-200 text-green-900'
    },
    {
      label: 'Total',
      value: stats.total,
      key: 'total',
      color: 'bg-gray-50 border-gray-200 text-gray-900'
    }
  ]

  if (loading) {
    return (
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map(card => (
            <div
              key={card.key}
              className={`${card.color} border rounded-lg p-4 transition-all hover:shadow-md`}
            >
              <div className="text-sm font-medium opacity-80">{card.label}</div>
              <div className="text-2xl font-bold mt-1">{card.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
