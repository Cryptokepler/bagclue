import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated } from '@/lib/session'
import AdminNav from '@/components/admin/AdminNav'
import ClienteProfile from '@/components/admin/clientes/ClienteProfile'
import ClienteStats from '@/components/admin/clientes/ClienteStats'
import ClienteOrders from '@/components/admin/clientes/ClienteOrders'
import ClienteLayaways from '@/components/admin/clientes/ClienteLayaways'
import ClientePaymentReviews from '@/components/admin/clientes/ClientePaymentReviews'
import ClienteDetailClient from './ClienteDetailClient'
import type { ClienteDetailResponse } from '@/types/admin-clientes'

async function getClienteDetail(id: string): Promise<ClienteDetailResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin/clientes/${encodeURIComponent(id)}`, {
      cache: 'no-store'
    })
    
    if (!res.ok) {
      console.error('[CLIENTE DETAIL PAGE] Fetch failed:', res.status)
      return null
    }
    
    return await res.json()
  } catch (error) {
    console.error('[CLIENTE DETAIL PAGE] Error:', error)
    return null
  }
}

export default async function AdminClienteDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
    redirect('/admin/login')
  }

  const { id } = await params
  const clienteDetail = await getClienteDetail(id)

  if (!clienteDetail) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <AdminNav />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl text-white mb-4">Cliente no encontrado</h1>
            <Link
              href="/admin/clientes"
              className="text-[#FF69B4] hover:text-[#FF69B4]/80"
            >
              Volver a clientes
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminNav />
      <ClienteDetailClient clienteDetail={clienteDetail} />
    </div>
  )
}
