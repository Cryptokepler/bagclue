'use client'

import type { ClienteMetrics } from '@/types/admin-clientes'

interface Props {
  metrics: ClienteMetrics
}

export default function ClientesDashboard({ metrics }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Total clientes */}
      <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
        <div className="text-3xl font-bold text-white mb-1">
          {metrics.total_customers}
        </div>
        <div className="text-sm text-gray-400">Total clientes</div>
      </div>

      {/* Clientes con compras */}
      <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
        <div className="text-3xl font-bold text-emerald-400 mb-1">
          {metrics.customers_with_purchases}
        </div>
        <div className="text-sm text-gray-400">Con compras</div>
      </div>

      {/* Pagos pendientes */}
      <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
        <div className="text-3xl font-bold text-yellow-400 mb-1">
          {metrics.pending_payments_count}
        </div>
        <div className="text-sm text-gray-400">Pagos pendientes</div>
      </div>

      {/* Pagos en revisión */}
      <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
        <div className="text-3xl font-bold text-[#FF69B4] mb-1">
          {metrics.payments_under_review_count}
        </div>
        <div className="text-sm text-gray-400">Pagos en revisión</div>
      </div>

      {/* Pendientes de dirección */}
      <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
        <div className="text-3xl font-bold text-orange-400 mb-1">
          {metrics.pending_address_count}
        </div>
        <div className="text-sm text-gray-400">Pendientes de dirección</div>
      </div>

      {/* Apartados activos */}
      <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
        <div className="text-3xl font-bold text-blue-400 mb-1">
          {metrics.active_layaways_count}
        </div>
        <div className="text-sm text-gray-400">Apartados activos</div>
      </div>

      {/* Valor total vendido */}
      <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
        <div className="text-2xl font-bold text-emerald-400 mb-1">
          {formatCurrency(metrics.total_sales_value)}
        </div>
        <div className="text-sm text-gray-400">Valor total vendido</div>
      </div>

      {/* Saldo pendiente total */}
      <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
        <div className="text-2xl font-bold text-yellow-400 mb-1">
          {formatCurrency(metrics.total_balance_due)}
        </div>
        <div className="text-sm text-gray-400">Saldo pendiente total</div>
      </div>
    </div>
  )
}
