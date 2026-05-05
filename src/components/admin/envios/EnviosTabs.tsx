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
    <div className="mb-6 overflow-x-auto border-b border-[#FF69B4]/10">
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
                  ? 'border-[#FF69B4] text-[#FF69B4]'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-[#FF69B4]/50'
                }
              `}
            >
              {tab.label}
              <span
                className={`
                  ml-2 px-2 py-0.5 text-xs rounded-full
                  ${isActive
                    ? 'bg-[#FF69B4]/20 text-[#FF69B4]'
                    : 'bg-white/5 text-gray-400'
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
  )
}
