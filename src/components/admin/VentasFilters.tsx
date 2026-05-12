'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

type SearchParams = {
  type?: string
  date?: string
  payment_status?: string
  shipping_status?: string
  sort?: string
  search?: string
}

type VentasFiltersProps = {
  currentParams: SearchParams
}

export default function VentasFilters({ currentParams }: VentasFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [searchValue, setSearchValue] = useState(currentParams.search || '')
  
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter('search', searchValue)
  }
  
  return (
    <div className="mb-6 bg-white/5 border border-[#FF69B4]/20 p-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar por cliente o email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="flex-1 px-4 py-2 bg-black/50 border border-[#FF69B4]/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#FF69B4]/50 transition-colors"
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-[#FF69B4] text-white text-sm font-medium hover:bg-[#FF69B4]/80 transition-colors disabled:opacity-50"
          >
            Buscar
          </button>
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                setSearchValue('')
                updateFilter('search', '')
              }}
              className="px-4 py-2 bg-white/10 text-gray-400 text-sm hover:bg-white/20 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </form>
      
      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Date Filter */}
        <div>
          <label className="block text-xs text-gray-400 mb-2">Fecha</label>
          <select
            value={currentParams.date || 'all'}
            onChange={(e) => updateFilter('date', e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 bg-black/50 border border-[#FF69B4]/20 text-white text-sm focus:outline-none focus:border-[#FF69B4]/50 transition-colors disabled:opacity-50"
          >
            <option value="all">Todas</option>
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
          </select>
        </div>
        
        {/* Payment Status Filter */}
        <div>
          <label className="block text-xs text-gray-400 mb-2">Estado de pago</label>
          <select
            value={currentParams.payment_status || 'all'}
            onChange={(e) => updateFilter('payment_status', e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 bg-black/50 border border-[#FF69B4]/20 text-white text-sm focus:outline-none focus:border-[#FF69B4]/50 transition-colors disabled:opacity-50"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="paid">Pagada</option>
            <option value="under_review">En revisión</option>
          </select>
        </div>
        
        {/* Shipping Status Filter */}
        <div>
          <label className="block text-xs text-gray-400 mb-2">Estado de envío</label>
          <select
            value={currentParams.shipping_status || 'all'}
            onChange={(e) => updateFilter('shipping_status', e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 bg-black/50 border border-[#FF69B4]/20 text-white text-sm focus:outline-none focus:border-[#FF69B4]/50 transition-colors disabled:opacity-50"
          >
            <option value="all">Todos</option>
            <option value="pending_address">Pendiente</option>
            <option value="preparing">Preparando</option>
            <option value="shipped">Enviada</option>
            <option value="delivered">Entregada</option>
          </select>
        </div>
        
        {/* Sort */}
        <div>
          <label className="block text-xs text-gray-400 mb-2">Ordenar</label>
          <select
            value={currentParams.sort || 'newest'}
            onChange={(e) => updateFilter('sort', e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 bg-black/50 border border-[#FF69B4]/20 text-white text-sm focus:outline-none focus:border-[#FF69B4]/50 transition-colors disabled:opacity-50"
          >
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguas</option>
            <option value="highest">Mayor monto</option>
            <option value="lowest">Menor monto</option>
            <option value="least_pending">Menor saldo pendiente</option>
            <option value="most_pending">Mayor saldo pendiente</option>
            <option value="next_payment">Próximo pago</option>
          </select>
        </div>
        
        {/* Clear All */}
        <div className="flex items-end">
          <button
            onClick={() => {
              setSearchValue('')
              router.push(pathname)
            }}
            disabled={isPending}
            className="w-full px-4 py-2 bg-white/10 text-gray-400 text-sm hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  )
}
