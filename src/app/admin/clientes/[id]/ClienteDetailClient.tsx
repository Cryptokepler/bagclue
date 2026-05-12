'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ClienteProfile from '@/components/admin/clientes/ClienteProfile'
import ClienteStats from '@/components/admin/clientes/ClienteStats'
import ClienteOrders from '@/components/admin/clientes/ClienteOrders'
import ClienteLayaways from '@/components/admin/clientes/ClienteLayaways'
import ClientePaymentReviews from '@/components/admin/clientes/ClientePaymentReviews'
import EditClienteForm from '@/components/admin/clientes/EditClienteForm'
import ClienteNotesSection from '@/components/admin/clientes/ClienteNotesSection'
import ClienteActionsSection from '@/components/admin/clientes/ClienteActionsSection'
import ClienteArchivedBadge from '@/components/admin/clientes/ClienteArchivedBadge'
import type { ClienteDetailResponse } from '@/types/admin-clientes'

interface Props {
  clienteDetail: ClienteDetailResponse
}

export default function ClienteDetailClient({ clienteDetail: initialData }: Props) {
  const router = useRouter()
  const [clienteDetail] = useState(initialData)

  const handleRefresh = () => {
    router.refresh()
  }

  const { profile, addresses, stats, orders, layaways, payment_reviews } = clienteDetail

  const hasOrders = orders.length > 0
  const hasLayaways = layaways.length > 0

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/clientes"
          className="text-[#FF69B4] hover:text-[#FF69B4]/80 transition-colors mb-4 inline-block"
        >
          ← Volver a clientes
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white">
            {profile.name || profile.email}
          </h1>
          <ClienteArchivedBadge archivedAt={profile.archived_at} />
        </div>
        <p className="text-gray-400">
          {profile.type === 'registered' ? 'Cliente registrado' : 'Cliente guest'}
        </p>
      </div>

      {/* Profile (con edición) */}
      <EditClienteForm profile={profile} onSaved={handleRefresh} />

      {/* Gestión del Cliente - MVP.2 */}
      <div className="mt-8 space-y-8">
        <h2 className="text-2xl text-white font-medium">Gestión del Cliente</h2>
        
        {/* Notas Internas */}
        <ClienteNotesSection profile={profile} onSaved={handleRefresh} />

        {/* Acciones */}
        <ClienteActionsSection 
          profile={profile} 
          hasOrders={hasOrders}
          hasLayaways={hasLayaways}
        />
      </div>

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
  )
}
