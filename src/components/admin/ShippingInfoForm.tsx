'use client'

import { useState, useEffect } from 'react'

interface ShippingInfoFormProps {
  orderId: string
  initialData: {
    status?: string | null
    customer_phone?: string | null
    shipping_address?: string | null
    shipping_status?: string | null
    shipping_provider?: string | null
    tracking_number?: string | null
    tracking_url?: string | null
    notes?: string | null
    tracking_token?: string | null
  }
  onSuccess?: () => void
}

export default function ShippingInfoForm({ orderId, initialData, onSuccess }: ShippingInfoFormProps) {
  const [formData, setFormData] = useState({
    status: initialData.status || 'confirmed',
    customer_phone: initialData.customer_phone || '',
    shipping_address: initialData.shipping_address || '',
    shipping_status: initialData.shipping_status || 'pending',
    shipping_provider: initialData.shipping_provider || '',
    tracking_number: initialData.tracking_number || '',
    tracking_url: initialData.tracking_url || '',
    notes: initialData.notes || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bagclue.vercel.app'
  const publicTrackingUrl = initialData.tracking_token 
    ? `${baseUrl}/track/${initialData.tracking_token}`
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Update order status
      const statusResponse = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: formData.status })
      })

      if (!statusResponse.ok) {
        const statusData = await statusResponse.json()
        throw new Error(statusData.error || 'Error al actualizar estado de orden')
      }

      // Update shipping info
      const shippingResponse = await fetch(`/api/orders/${orderId}/shipping`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_phone: formData.customer_phone,
          shipping_address: formData.shipping_address,
          shipping_status: formData.shipping_status,
          shipping_provider: formData.shipping_provider || null,
          tracking_number: formData.tracking_number || null,
          tracking_url: formData.tracking_url || null,
          notes: formData.notes || null
        })
      })

      const shippingData = await shippingResponse.json()

      if (!shippingResponse.ok) {
        throw new Error(shippingData.error || 'Error al actualizar información de envío')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCopyLink = () => {
    if (publicTrackingUrl) {
      navigator.clipboard.writeText(publicTrackingUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tracking Link - Always visible */}
      {publicTrackingUrl && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
          <p className="text-sm font-medium text-gray-900 mb-2">
            🔗 Link de seguimiento del cliente:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={publicTrackingUrl}
              readOnly
              className="flex-1 text-sm bg-white border border-gray-300 px-3 py-2 rounded font-mono"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2 text-sm border border-blue-300 hover:border-blue-500 transition-colors bg-white rounded"
            >
              {copySuccess ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Comparte este link con el cliente para que rastree su pedido sin necesidad de login
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white/5 border border-[#FF69B4]/20 p-6 rounded">
        <h3 className="text-lg font-medium text-white mb-4">Gestión de Orden y Envío</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-400 text-sm rounded">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-sm rounded">
            ✅ Cambios guardados correctamente
          </div>
        )}

        {/* Estado de la orden */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Estado de la orden *
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full bg-white/10 border border-[#FF69B4]/20 text-white px-3 py-2 rounded focus:border-[#FF69B4]/50 focus:outline-none"
          >
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmada</option>
            <option value="preparing">Preparando</option>
            <option value="shipped">Enviada</option>
            <option value="delivered">Entregada</option>
            <option value="cancelled">Cancelada</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Estado general de la orden
          </p>
        </div>

        {/* Estado del envío */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Estado del envío *
          </label>
          <select
            value={formData.shipping_status}
            onChange={(e) => setFormData({ ...formData, shipping_status: e.target.value })}
            className="w-full bg-white/10 border border-[#FF69B4]/20 text-white px-3 py-2 rounded focus:border-[#FF69B4]/50 focus:outline-none"
          >
            <option value="pending">Pendiente</option>
            <option value="preparing">Preparando pieza</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregado</option>
          </select>
        </div>

        {/* Paquetería */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Paquetería
          </label>
          <select
            value={formData.shipping_provider}
            onChange={(e) => setFormData({ ...formData, shipping_provider: e.target.value })}
            className="w-full bg-white/10 border border-[#FF69B4]/20 text-white px-3 py-2 rounded focus:border-[#FF69B4]/50 focus:outline-none"
          >
            <option value="">(Sin asignar)</option>
            <option value="dhl">DHL Express</option>
            <option value="fedex">FedEx</option>
            <option value="manual">Manual / Mensajería local</option>
          </select>
        </div>

        {/* Número de rastreo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Número de rastreo
          </label>
          <input
            type="text"
            value={formData.tracking_number}
            onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
            placeholder="Ej: 1234567890"
            className="w-full bg-white/10 border border-[#FF69B4]/20 text-white px-3 py-2 rounded focus:border-[#FF69B4]/50 focus:outline-none placeholder-gray-500"
          />
        </div>

        {/* URL de rastreo (opcional) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Link de rastreo externo (opcional)
          </label>
          <input
            type="text"
            value={formData.tracking_url}
            onChange={(e) => setFormData({ ...formData, tracking_url: e.target.value })}
            placeholder="Se genera automáticamente si se deja vacío"
            className="w-full bg-white/10 border border-[#FF69B4]/20 text-white px-3 py-2 rounded focus:border-[#FF69B4]/50 focus:outline-none text-sm placeholder-gray-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Si dejas vacío, se generará automáticamente según la paquetería (DHL/FedEx)
          </p>
        </div>

        {/* Teléfono del cliente */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Teléfono del cliente
          </label>
          <input
            type="tel"
            value={formData.customer_phone}
            onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
            placeholder="+52 55 1234 5678"
            className="w-full bg-white/10 border border-[#FF69B4]/20 text-white px-3 py-2 rounded focus:border-[#FF69B4]/50 focus:outline-none placeholder-gray-500"
          />
        </div>

        {/* Dirección de envío */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Dirección de envío
          </label>
          <textarea
            value={formData.shipping_address}
            onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
            placeholder="Calle, número, colonia&#10;Ciudad, CP&#10;Estado, País"
            rows={4}
            className="w-full bg-white/10 border border-[#FF69B4]/20 text-white px-3 py-2 rounded focus:border-[#FF69B4]/50 focus:outline-none placeholder-gray-500"
          />
        </div>

        {/* Notas internas */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Notas internas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notas privadas sobre el envío..."
            rows={3}
            className="w-full bg-white/10 border border-[#FF69B4]/20 text-white px-3 py-2 rounded focus:border-[#FF69B4]/50 focus:outline-none placeholder-gray-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Estas notas son privadas y no las ve el cliente
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#FF69B4] text-white py-3 rounded hover:bg-[#FF69B4]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando cambios...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
