'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

type VentasTabsProps = {
  currentType: 'all' | 'cash' | 'layaway'
}

export default function VentasTabs({ currentType }: VentasTabsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const createHref = (type: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('type', type)
    return `${pathname}?${params.toString()}`
  }
  
  const tabs = [
    { id: 'all', label: 'Todas', href: createHref('all') },
    { id: 'cash', label: 'Contado', href: createHref('cash') },
    { id: 'layaway', label: 'A pagos', href: createHref('layaway') }
  ]
  
  return (
    <div className="mb-6 border-b border-[#FF69B4]/20">
      <div className="flex gap-6">
        {tabs.map(tab => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
              currentType === tab.id
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
