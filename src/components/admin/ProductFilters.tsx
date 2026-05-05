'use client'

// src/components/admin/ProductFilters.tsx
// Filtros para listado de productos

import { useRouter, useSearchParams } from 'next/navigation'
import ProductSearchBar from './ProductSearchBar'

export default function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const search = searchParams.get('search') || ''
  const statusFilter = searchParams.get('status') || 'all'
  const publishedFilter = searchParams.get('published') || 'all'
  const categoryFilter = searchParams.get('category') || 'all'
  const imageFilter = searchParams.get('images') || 'all'
  const costFilter = searchParams.get('cost') || 'all'
  const authFilter = searchParams.get('auth') || 'all'
  
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all' || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/admin/productos?${params.toString()}`)
  }
  
  const clearFilters = () => {
    router.push('/admin/productos')
  }
  
  const activeFiltersCount = [
    search,
    statusFilter !== 'all' ? statusFilter : null,
    publishedFilter !== 'all' ? publishedFilter : null,
    categoryFilter !== 'all' ? categoryFilter : null,
    imageFilter !== 'all' ? imageFilter : null,
    costFilter !== 'all' ? costFilter : null,
    authFilter !== 'all' ? authFilter : null
  ].filter(Boolean).length
  
  return (
    <div className="mb-6 space-y-4">
      {/* Búsqueda */}
      <ProductSearchBar
        value={search}
        onChange={(value) => updateFilter('search', value)}
      />
      
      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="bg-white/5 border border-[#FF69B4]/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FF69B4] transition-colors"
        >
          <option value="all">Todos los status</option>
          <option value="available">Disponible</option>
          <option value="preorder">Pre-orden</option>
          <option value="reserved">Reservado</option>
          <option value="sold">Vendido</option>
        </select>
        
        {/* Publicación */}
        <select
          value={publishedFilter}
          onChange={(e) => updateFilter('published', e.target.value)}
          className="bg-white/5 border border-[#FF69B4]/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FF69B4] transition-colors"
        >
          <option value="all">Todos</option>
          <option value="published">Publicados</option>
          <option value="draft">Borradores</option>
        </select>
        
        {/* Categoría */}
        <select
          value={categoryFilter}
          onChange={(e) => updateFilter('category', e.target.value)}
          className="bg-white/5 border border-[#FF69B4]/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FF69B4] transition-colors"
        >
          <option value="all">Todas las categorías</option>
          <option value="Bolsas">Bolsas</option>
          <option value="Cinturones">Cinturones</option>
          <option value="Zapatos">Zapatos</option>
          <option value="Joyería">Joyería</option>
        </select>
        
        {/* Imágenes */}
        <select
          value={imageFilter}
          onChange={(e) => updateFilter('images', e.target.value)}
          className="bg-white/5 border border-[#FF69B4]/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FF69B4] transition-colors"
        >
          <option value="all">Todas</option>
          <option value="with-image">Con imagen</option>
          <option value="without-image">Sin imagen</option>
        </select>
        
        {/* Costo */}
        <select
          value={costFilter}
          onChange={(e) => updateFilter('cost', e.target.value)}
          className="bg-white/5 border border-[#FF69B4]/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FF69B4] transition-colors"
        >
          <option value="all">Todos</option>
          <option value="with-cost">Con costo</option>
          <option value="without-cost">Sin costo</option>
        </select>
        
        {/* Autenticidad */}
        <select
          value={authFilter}
          onChange={(e) => updateFilter('auth', e.target.value)}
          className="bg-white/5 border border-[#FF69B4]/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FF69B4] transition-colors"
        >
          <option value="all">Todos</option>
          <option value="verified">Verificada</option>
          <option value="not-verified">No verificada</option>
        </select>
        
        {/* Limpiar filtros */}
        {activeFiltersCount > 0 && (
          <>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-400 hover:text-[#FF69B4] transition-colors px-3 py-2"
            >
              Limpiar filtros
            </button>
            <span className="text-xs text-gray-500 self-center">
              {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} aplicado{activeFiltersCount !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
