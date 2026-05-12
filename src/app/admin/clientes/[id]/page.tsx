import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated } from '@/lib/session'
import AdminNav from '@/components/admin/AdminNav'
import ClienteProfile from '@/components/admin/clientes/ClienteProfile'
import ClienteStats from '@/components/admin/clientes/ClienteStats'
import ClienteOrders from '@/components/admin/clientes/ClienteOrders'
import ClienteLayaways from '@/components/admin/clientes/ClienteLayaways'
import ClientePaymentReviews from '@/components/admin/clientes/ClientePaymentReviews'
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

  const { profile, addresses, stats, orders, layaways, payment_reviews } = clienteDetail

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/clientes"
            className="text-[#FF69B4] hover:text-[#FF69B4]/80 transition-colors mb-4 inline-block"
          >
            ← Volver a clientes
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            {profile.name || profile.email}
          </h1>
          <p className="text-gray-400">
            {profile.type === 'registered' ? 'Cliente registrado' : 'Cliente guest'}
          </p>
        </div>

        {/* Profile */}
        <ClienteProfile profile={profile} />

        {/* Addresses (solo si registrado) */}
        {profile.type === 'registered' && addresses.length > 0 && (
          <div className="mt-8 bg-white/5 border border-[#FF69B4]/20 p-6">
            <h2 className="text-lg text-white font-medium mb-4">
              Direcciones guardadas ({addresses.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="bg-white/5 border border-[#FF69B4]/10 p-4"
                >
                  {address.is_default && (
                    <div className="text-xs text-emerald-400 mb-2">📍 Dirección principal</div>
                  )}
                  <div className="text-white font-medium mb-1">{address.full_name}</div>
                  <div className="text-sm text-gray-300">
                    {address.address_line1}
                    {address.address_line2 && <>, {address.address_line2}</>}
                  </div>
                  <div className="text-sm text-gray-300">
                    {address.city}, {address.state} {address.postal_code}
                  </div>
                  <div className="text-sm text-gray-300">{address.country}</div>
                  <div className="text-sm text-gray-400 mt-2">
                    {address.phone_country_code} {address.phone}
                  </div>
                  {address.delivery_references && (
                    <div className="text-sm text-gray-400 mt-1">
                      Ref: {address.delivery_references}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8">
          <h2 className="text-xl text-white font-medium mb-4">Resumen Comercial</h2>
          <ClienteStats stats={stats} />
        </div>

        {/* Payment Reviews */}
        <ClientePaymentReviews paymentReviews={payment_reviews} />

        {/* Orders */}
        <ClienteOrders orders={orders} />

        {/* Layaways */}
        <ClienteLayaways layaways={layaways} />
      </main>
    </div>
  )
}
