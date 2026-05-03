'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

interface AccountLayoutProps {
  children: React.ReactNode
  userEmail?: string
}

export default function AccountLayout({ children, userEmail }: AccountLayoutProps) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    if (!confirm('¿Seguro que quieres cerrar sesión?')) return

    setLoggingOut(true)

    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      alert('Error al cerrar sesión')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-playfair tracking-wide text-gray-900">
                BAGCLUE
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2 flex-1 justify-center">
              <Link 
                href="/account" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Mi cuenta
              </Link>
              <Link 
                href="/account/orders" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Mis pedidos
              </Link>
              <Link 
                href="/account/layaways" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Mis apartados
              </Link>
              <Link 
                href="/account/addresses" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Mis direcciones
              </Link>
              <Link 
                href="/account/profile" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Perfil
              </Link>
              <Link 
                href="/catalogo" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Catálogo
              </Link>
            </nav>

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {userEmail && (
                <span className="hidden lg:block text-sm text-gray-600">
                  {userEmail}
                </span>
              )}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loggingOut ? 'Cerrando...' : 'Cerrar sesión'}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col space-y-3">
                {userEmail && (
                  <div className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded">
                    {userEmail}
                  </div>
                )}
                <Link 
                  href="/account" 
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mi cuenta
                </Link>
                <Link 
                  href="/account/orders" 
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mis pedidos
                </Link>
                <Link 
                  href="/account/layaways" 
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mis apartados
                </Link>
                <Link 
                  href="/account/addresses" 
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mis direcciones
                </Link>
                <Link 
                  href="/account/profile" 
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Perfil
                </Link>
                <Link 
                  href="/catalogo" 
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Catálogo
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mx-4 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                >
                  {loggingOut ? 'Cerrando...' : 'Cerrar sesión'}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-600">
          <a href="/" className="hover:text-gray-900 transition-colors">
            ← Volver a la tienda
          </a>
        </div>
      </footer>
    </div>
  )
}
