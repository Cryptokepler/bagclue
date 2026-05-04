'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseCustomer } from '@/lib/supabase-customer'

interface Address {
  id: string
  full_name: string
  phone_country_code: string
  phone: string
  country: string
  state: string
  city: string
  postal_code: string
  address_line1: string
  address_line2?: string
  is_default: boolean
}

interface ShippingAddressSectionProps {
  order: any
  onAddressUpdated?: () => void
}

export default function ShippingAddressSection({ 
  order, 
  onAddressUpdated 
}: ShippingAddressSectionProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [currentShippingAddress, setCurrentShippingAddress] = useState(order.shipping_address)

  // Determinar si puede editar dirección
  const canEditAddress = order.payment_status === 'paid' && 
    (order.shipping_status === 'pending' || 
     order.shipping_status === 'preparing' || 
     !order.shipping_status)

  const isShipped = order.shipping_status === 'shipped' || 
                    order.shipping_status === 'delivered'

  useEffect(() => {
    loadAddresses()
  }, [])

  async function loadAddresses() {
    try {
      setLoading(true)
      const { data, error } = await supabaseCustomer
        .from('customer_addresses')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[SHIPPING ADDRESS] Error loading addresses:', error)
        return
      }

      setAddresses(data || [])
      
      // Si hay dirección default y no hay dirección confirmada, pre-seleccionarla
      if (!currentShippingAddress && data && data.length > 0) {
        const defaultAddr = data.find(a => a.is_default)
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id)
        } else {
          setSelectedAddressId(data[0].id)
        }
      }
    } catch (err) {
      console.error('[SHIPPING ADDRESS] Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmAddress() {
    if (!selectedAddressId) {
      setError('Por favor selecciona una dirección')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      // Get auth token
      const { data: { session }, error: sessionError } = await supabaseCustomer.auth.getSession()
      
      if (sessionError || !session) {
        window.location.href = '/account/login'
        return
      }

      // Call PATCH endpoint
      const response = await fetch(`/api/account/orders/${order.id}/shipping-address`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          address_id: selectedAddressId
        })
      })

      const data = await response.json()

      if (response.status === 401) {
        window.location.href = '/account/login'
        return
      }

      if (!response.ok) {
        setError(data.error || 'Error al actualizar la dirección')
        return
      }

      // Success
      setSuccess('Dirección de envío actualizada correctamente')
      setCurrentShippingAddress(data.order.shipping_address)
      setEditing(false)
      
      // Refresh page after 1s to update all data
      setTimeout(() => {
        if (onAddressUpdated) {
          onAddressUpdated()
        } else {
          window.location.reload()
        }
      }, 1000)
    } catch (err) {
      console.error('[SHIPPING ADDRESS] Error:', err)
      setError('Error inesperado al actualizar la dirección')
    } finally {
      setSubmitting(false)
    }
  }

  function formatAddress(addr: Address): string {
    return `${addr.full_name}
${addr.address_line1}
${addr.address_line2 || ''}
${addr.city}, ${addr.state}, ${addr.postal_code}
${addr.country}
Tel: ${addr.phone_country_code} ${addr.phone}`.trim()
  }

  // Si no está pagado
  if (order.payment_status !== 'paid') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dirección de envío</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            La dirección de envío se podrá confirmar cuando el pago esté aprobado.
          </p>
        </div>
      </div>
    )
  }

  // Si ya está enviado/entregado - solo lectura
  if (isShipped && currentShippingAddress) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dirección de envío</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-900 whitespace-pre-line text-sm">{currentShippingAddress}</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          La dirección no se puede modificar una vez que el pedido ha sido enviado.
        </p>
      </div>
    )
  }

  // Si tiene dirección confirmada pero puede cambiarla
  if (currentShippingAddress && !editing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Dirección de envío</h3>
          {canEditAddress && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-[#FF69B4] hover:underline"
            >
              Cambiar dirección
            </button>
          )}
        </div>
        
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <span className="text-teal-700">✅</span>
            <p className="text-sm font-medium text-teal-800">Dirección confirmada</p>
          </div>
          <p className="text-gray-900 whitespace-pre-line text-sm">{currentShippingAddress}</p>
        </div>
        
        {success && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-sm text-emerald-800">{success}</p>
          </div>
        )}
      </div>
    )
  }

  // Si no tiene dirección o está editando
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dirección de envío</h3>
        <p className="text-gray-600 text-sm">Cargando direcciones...</p>
      </div>
    )
  }

  // Si no hay direcciones guardadas
  if (addresses.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dirección de envío</h3>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-orange-800 text-sm mb-3">
            No tienes direcciones guardadas. Agrega una dirección para confirmar el envío.
          </p>
          <Link
            href="/account/addresses"
            className="inline-block bg-[#FF69B4] text-white px-4 py-2 text-sm hover:bg-[#FF69B4]/90 transition-colors"
          >
            Agregar dirección
          </Link>
        </div>
      </div>
    )
  }

  // Formulario para confirmar/cambiar dirección
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          {currentShippingAddress ? 'Cambiar dirección de envío' : 'Confirma tu dirección de envío'}
        </h3>
        {editing && (
          <button
            onClick={() => setEditing(false)}
            className="text-sm text-gray-600 hover:underline"
          >
            Cancelar
          </button>
        )}
      </div>

      {!currentShippingAddress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 text-sm">
            Selecciona la dirección donde quieres recibir tu pedido.
          </p>
        </div>
      )}

      <div className="space-y-3 mb-4">
        {addresses.map((addr) => (
          <label
            key={addr.id}
            className={`block border rounded-lg p-4 cursor-pointer transition-all ${
              selectedAddressId === addr.id
                ? 'border-[#FF69B4] bg-pink-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="address"
                value={addr.id}
                checked={selectedAddressId === addr.id}
                onChange={(e) => setSelectedAddressId(e.target.value)}
                className="mt-1 text-[#FF69B4] focus:ring-[#FF69B4]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium text-gray-900 text-sm">{addr.full_name}</p>
                  {addr.is_default && (
                    <span className="text-xs bg-[#FF69B4] text-white px-2 py-0.5 rounded">
                      Principal
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {formatAddress(addr)}
                </p>
              </div>
            </div>
          </label>
        ))}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-sm text-emerald-800">{success}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleConfirmAddress}
          disabled={submitting || !selectedAddressId}
          className="flex-1 bg-[#FF69B4] text-white px-6 py-3 hover:bg-[#FF69B4]/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {submitting ? 'Confirmando...' : currentShippingAddress ? 'Cambiar dirección' : 'Confirmar esta dirección'}
        </button>
        
        <Link
          href="/account/addresses"
          className="border border-gray-300 text-gray-700 px-6 py-3 hover:border-[#FF69B4] hover:text-[#FF69B4] transition-colors inline-flex items-center justify-center"
        >
          Gestionar direcciones
        </Link>
      </div>
    </div>
  )
}
