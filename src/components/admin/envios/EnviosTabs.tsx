'use client'

import { EnviosFilter, EnviosStats } from '@/types/admin-envios'

interface EnviosTabsProps {
  activeTab: EnviosFilter
  onTabChange: (tab: EnviosFilter) => void
  stats: EnviosStats
}

export default function EnviosTabs({ activeTab, onTabChange, stats }: EnviosTabsProps) {
  const tabs: { key: EnviosFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: stats.total },
    { key: 'pending_address', label: 'Pendiente Dirección', count: stats.pending_address },
    { key: 'pending_shipment', label: 'Pendiente Envío', count: stats.pending_shipment },
    { key: 'preparing', label: 'Preparando', count: stats.preparing },
    { key: 'shipped', label: 'Enviados', count: stats.shipped },
    { key: 'delivered', label: 'Entregados', count: stats.delivered }
  ]

  return (
    <div className="bg-white border-b overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-2 min-w-max">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`
                  px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors
                  ${isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
                <span
                  className={`
                    ml-2 px-2 py-0.5 text-xs rounded-full
                    ${isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
