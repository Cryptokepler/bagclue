import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/session'
import AdminNav from '@/components/admin/AdminNav'
import ClientesListClient from './ClientesListClient'

async function getMetrics() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin/clientes/metrics`, {
      cache: 'no-store',
      headers: {
        'Cookie': process.env.NODE_ENV === 'development' ? '' : ''
      }
    })
    
    if (!res.ok) {
      console.error('[CLIENTES PAGE] Metrics fetch failed:', res.status)
      return null
    }
    
    return await res.json()
  } catch (error) {
    console.error('[CLIENTES PAGE] Metrics error:', error)
    return null
  }
}

export default async function AdminClientesPage() {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
    redirect('/admin/login')
  }

  const metrics = await getMetrics()

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Gestión de Clientes</h1>
          <p className="text-gray-400">Vista completa de clientes, pedidos y apartados</p>
        </div>

        <ClientesListClient initialMetrics={metrics} />
      </main>
    </div>
  )
}
