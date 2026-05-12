'use client'

import { useState } from 'react'

interface Props {
  onFilterChange: (filters: {
    search: string
    status: string
    orderBy: string
  }) => void
}

export default function ClientesFilters({ onFilterChange }: Props) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [orderBy, setOrderBy] = useState('recent')

  const handleSearchChange = (value: string) => {
    setSearch(value)
    onFilterChange({ search: value, status, orderBy })
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    onFilterChange({ search, status: value, orderBy })
  }

  const handleOrderByChange = (value: string) => {
    setOrderBy(value)
    onFilterChange({ search, status, orderBy: value })
  }

  return (
    <div className="mb-6 flex flex-col md:flex-row gap-4">
      {/* Search */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-4 py-2 bg-white/5 border border-[#FF69B4]/20 text-white placeholder-gray-400 focus:outline-none focus:border-[#FF69B4]"
        />
      </div>

      {/* Status filter */}
      <div>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-[#FF69B4]/20 text-white focus:outline-none focus:border-[#FF69B4]"
        >
          <option value="all">Todos</option>
          <option value="pending_payments">Pagos pendientes</option>
          <option value="payment_review">Pago en revisión</option>
          <option value="confirmed_purchases">Compras confirmadas</option>
          <option value="pending_address">Pendientes de dirección</option>
          <option value="recurring">Recurrentes</option>
        </select>
      </div>

      {/* Order by */}
      <div>
        <select
          value={orderBy}
          onChange={(e) => handleOrderByChange(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-[#FF69B4]/20 text-white focus:outline-none focus:border-[#FF69B4]"
        >
          <option value="recent">Más recientes</option>
          <option value="total_spent">Mayor valor comprado</option>
          <option value="balance_due">Mayor saldo pendiente</option>
          <option value="last_purchase">Última compra</option>
        </select>
      </div>
    </div>
  )
}
