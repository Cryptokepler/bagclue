'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from './LogoutButton'

export default function AdminNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin', label: 'Productos' },
    { href: '/admin/envios', label: 'Envíos' },
    { href: '/admin/orders', label: 'Órdenes' }
  ]

  return (
    <header className="border-b border-[#FF69B4]/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl text-white">
            BAGCLUE Admin
          </h1>
          <LogoutButton />
        </div>
        
        <nav className="flex items-center gap-6">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm transition-colors ${
                pathname === item.href
                  ? 'text-[#FF69B4] border-b-2 border-[#FF69B4] pb-1'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <a
            href="/catalogo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Ver tienda ↗
          </a>
        </nav>
      </div>
    </header>
  )
}
