'use client'

import { useState } from 'react'

interface ShippingInfoFormProps {
  orderId: string
  initialData: {
    customer_phone?: string | null
    shipping_address?: string | null
    shipping_status?: string | null
    shipping_provider?: string | null
    tracking_number?: string | null
    tracking_url?: string | null
    notes?: string | null
  }
  onSuccess?: () => void
}

export default function ShippingInfoForm({ orderId, initialData, onSuccess }: ShippingInfoFormProps) {
  const [formData, setFormData] = useState({
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
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/orders/${orderId}/shipping`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          shipping_provider: formData.shipping_provider || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar')
      }

      setTrackingUrl(data.public_tracking_url)
      
      if (onSuccess) onSuccess()
      
      alert('Información de envío actualizada correctamente')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCopyLink = () => {
    if (trackingUrl) {
      navigator.clipboard.writeText(trackingUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información de envío</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Estado del envío */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado del envío
          </label>
          <select
            value={formData.shipping_status}
            onChange={(e) => setFormData({ ...formData, shipping_status: e.target.value })}
            className="w-full border border-gray-300 px-3 py-2 rounded"
          >
            <option value="pending">Pendiente</option>
            <option value="preparing">Preparando</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregado</option>
          </select>
        </div>

        {/* Paquetería */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paquetería
          </label>
          <select
            value={formData.shipping_provider}
            onChange={(e) => setFormData({ ...formData, shipping_provider: e.target.value })}
            className="w-full border border-gray-300 px-3 py-2 rounded"
          >
            <option value="">(Sin asignar)</option>
            <option value="dhl">DHL Express</option>
            <option value="fedex">FedEx</option>
          </select>
        </div>

        {/* Número de rastreo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de rastreo
          </label>
          <input
            type="text"
            value={formData.tracking_number}
            onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
            placeholder="Ej: 1234567890"
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />
        </div>

        {/* URL de rastreo (opcional) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Link de rastreo (opcional)
          </label>
          <input
            type="text"
            value={formData.tracking_url}
            onChange={(e) => setFormData({ ...formData, tracking_url: e.target.value })}
            placeholder="Se genera automáticamente si se deja vacío"
            className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Si dejas este campo vacío, se generará automáticamente según la paquetería
          </p>
        </div>

        {/* Teléfono del cliente */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono del cliente
          </label>
          <input
            type="tel"
            value={formData.customer_phone}
            onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
            placeholder="+52 55 1234 5678"
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />
        </div>

        {/* Dirección de envío */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección de envío
          </label>
          <textarea
            value={formData.shipping_address}
            onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
            placeholder="Calle, número, colonia&#10;Ciudad, CP&#10;Estado, País"
            rows={4}
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />
        </div>

        {/* Notas internas */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas internas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notas privadas sobre el envío..."
            rows={3}
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#FF69B4] text-white py-3 hover:bg-[#FF69B4]/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {/* Link de seguimiento */}
      {trackingUrl && (
        <div className="bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm font-medium text-gray-900 mb-2">
            Link de seguimiento (compartir con cliente):
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={trackingUrl}
              readOnly
              className="flex-1 text-sm bg-white border border-gray-300 px-3 py-2 rounded"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2 text-sm border border-blue-300 hover:border-blue-500 transition-colors bg-white"
            >
              {copySuccess ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
