'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function ProductsViewTabs() {
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view') || 'active'
  
  const tabs = [
    { id: 'active', label: 'Activos', href: '/admin/productos?view=active' },
    { id: 'inactive', label: 'Inactivos', href: '/admin/productos?view=inactive' },
    { id: 'sold', label: 'Vendidos', href: '/admin/productos?view=sold' },
    { id: 'archived', label: 'Archivo', href: '/admin/productos?view=archived' },
    { id: 'all', label: 'Todos', href: '/admin/productos?view=all' }
  ]
  
  return (
    <div className="mb-6 border-b border-[#FF69B4]/20">
      <div className="flex gap-6">
        {tabs.map(tab => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
              currentView === tab.id
                ? 'border-[#FF69B4] text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
