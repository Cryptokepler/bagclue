'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminNav from '@/components/admin/AdminNav'
import EnviosStats from '@/components/admin/envios/EnviosStats'
import EnviosTabs from '@/components/admin/envios/EnviosTabs'
import EnviosSearchBar from '@/components/admin/envios/EnviosSearchBar'
import EnviosTable from '@/components/admin/envios/EnviosTable'
import EnviosPagination from '@/components/admin/envios/EnviosPagination'
import {
  EnviosFilter,
  EnviosOrder,
  EnviosStats as StatsType,
  EnviosPagination as PaginationType,
  EnviosResponse
} from '@/types/admin-envios'

export default function AdminEnviosPage() {
  const router = useRouter()
  
  // State
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<EnviosFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [orders, setOrders] = useState<EnviosOrder[]>([])
  const [stats, setStats] = useState<StatsType | null>(null)
  const [pagination, setPagination] = useState<PaginationType | null>(null)
  const [offset, setOffset] = useState(0)
  const [authChecked, setAuthChecked] = useState(false)
  
  // Fetch data
  useEffect(() => {
    fetchOrders()
  }, [activeFilter, searchQuery, offset])
  
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        filter: activeFilter,
        limit: '25',
        offset: offset.toString(),
      })
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      
      const response = await fetch(`/api/admin/envios?${params}`)
      
      if (response.status === 401) {
        // Not authenticated, redirect to login
        router.push('/admin/login')
        return
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      
      const data: EnviosResponse = await response.json()
      setOrders(data.orders)
      setStats(data.stats)
      setPagination(data.pagination)
      setAuthChecked(true)
    } catch (error) {
      console.error('Error fetching orders:', error)
      // TODO: Toast error notification
    } finally {
      setLoading(false)
    }
  }
  
  const handleTabChange = (newTab: EnviosFilter) => {
    setActiveFilter(newTab)
    setOffset(0) // Reset pagination
  }
  
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setOffset(0) // Reset pagination
  }
  
  const handleOrderClick = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`)
  }
  
  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset)
  }

  // Don't render until auth check is done
  if (!authChecked && loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#FF69B4] border-t-transparent rounded-full"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminNav />
      
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Gestión de Envíos</h1>
          <p className="text-gray-400">Control de envíos, tracking y estados de entrega</p>
        </div>
        
        {/* Stats */}
        {stats && <EnviosStats stats={stats} loading={loading && !authChecked} />}
        
        {/* Tabs */}
        {stats && (
          <EnviosTabs
            activeTab={activeFilter}
            onTabChange={handleTabChange}
            stats={stats}
          />
        )}
        
        {/* Search + Actions */}
        <div className="mb-6">
          <EnviosSearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Buscar por cliente, email o tracking..."
          />
        </div>
        
        {/* Table */}
        <div className="mb-6">
          <EnviosTable
            orders={orders}
            loading={loading}
            onOrderClick={handleOrderClick}
            onActionComplete={fetchOrders}
          />
        </div>
        
        {/* Pagination */}
        {pagination && (
          <EnviosPagination
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        )}
      </main>
    </div>
  )
}
