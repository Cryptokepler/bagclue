'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface AccountLayoutProps {
  children: React.ReactNode
  userEmail?: string
}

export default function AccountLayout({ children, userEmail }: AccountLayoutProps) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <a href="/" className="text-2xl font-bold text-gray-900">
                Bagclue
              </a>
              <p className="text-sm text-gray-600 mt-1">Mi Cuenta</p>
            </div>
            
            <div className="flex items-center gap-4">
              {userEmail && (
                <span className="text-sm text-gray-600 hidden sm:block">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-600">
          <a href="/" className="hover:text-gray-900">
            ← Volver a la tienda
          </a>
        </div>
      </footer>
    </div>
  )
}
