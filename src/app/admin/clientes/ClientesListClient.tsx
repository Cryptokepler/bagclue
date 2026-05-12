'use client'

import { useState, useEffect } from 'react'
import ClientesDashboard from '@/components/admin/clientes/ClientesDashboard'
import ClientesFilters from '@/components/admin/clientes/ClientesFilters'
import ClientesTable from '@/components/admin/clientes/ClientesTable'
import type { ClienteMetrics, Cliente } from '@/types/admin-clientes'

interface Props {
  initialMetrics: ClienteMetrics | null
}

export default function ClientesListClient({ initialMetrics }: Props) {
  const [metrics, setMetrics] = useState<ClienteMetrics | null>(initialMetrics)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    orderBy: 'recent',
    showArchived: false
  })

  const fetchClientes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search: filters.search,
        status: filters.status,
        orderBy: filters.orderBy,
        showArchived: filters.showArchived.toString(),
        page: page.toString(),
        limit: '25'
      })

      const res = await fetch(`/api/admin/clientes?${params}`)
      if (!res.ok) {
        throw new Error('Failed to fetch clientes')
      }

      const data = await res.json()
      setClientes(data.clientes || [])
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('[CLIENTES LIST] Error:', error)
      setClientes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [filters, page])

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page on filter change
  }

  // Fetch metrics if not provided
  useEffect(() => {
    if (!metrics) {
      fetch('/api/admin/clientes/metrics')
        .then(res => res.json())
        .then(data => setMetrics(data))
        .catch(err => console.error('[CLIENTES LIST] Metrics error:', err))
    }
  }, [])

  return (
    <>
      {/* Dashboard */}
      {metrics && <ClientesDashboard metrics={metrics} />}

      {/* Filters */}
      <ClientesFilters onFilterChange={handleFilterChange} />

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-gray-400">Cargando clientes...</div>
        </div>
      )}

      {/* Table */}
      {!loading && <ClientesTable clientes={clientes} />}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white/5 border border-[#FF69B4]/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-gray-400">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white/5 border border-[#FF69B4]/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
    </>
  )
}
