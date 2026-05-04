'use client'

import { useState } from 'react'
import { EnviosOrder } from '@/types/admin-envios'

interface MarcarEnviadoModalProps {
  order: EnviosOrder
  onConfirm: (data: {
    shipping_provider: string
    tracking_number: string
    tracking_url?: string
  }) => void
  onClose: () => void
  loading?: boolean
}

const SHIPPING_PROVIDERS = [
  { value: 'DHL', label: 'DHL' },
  { value: 'FedEx', label: 'FedEx' },
  { value: 'UPS', label: 'UPS' },
  { value: 'Estafeta', label: 'Estafeta' },
  { value: 'Redpack', label: 'Redpack' },
  { value: 'Paquete Express', label: 'Paquete Express' },
  { value: 'Otro', label: 'Otro' },
]

export default function MarcarEnviadoModal({
  order,
  onConfirm,
  onClose,
  loading = false
}: MarcarEnviadoModalProps) {
  const [selectedProvider, setSelectedProvider] = useState('')
  const [customProvider, setCustomProvider] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')

  // Formatear ID corto (últimos 8 caracteres)
  const shortId = order.id.slice(-8).toUpperCase()

  // Obtener producto principal
  const mainProduct = order.order_items?.[0]
  const productName = mainProduct
    ? `${mainProduct.product_snapshot.brand} ${mainProduct.product_snapshot.title}`
    : 'Sin producto'

  // Formatear dirección (primeras 60 caracteres)
  const address = order.shipping_address
    ? order.shipping_address.length > 60
      ? order.shipping_address.slice(0, 57) + '...'
      : order.shipping_address
    : 'Sin dirección'

  // Validar form
  const isValid = () => {
    if (!selectedProvider) return false
    if (selectedProvider === 'Otro' && !customProvider.trim()) return false
    if (!trackingNumber.trim()) return false
    return true
  }

  const handleSubmit = () => {
    if (!isValid()) return

    const finalProvider = selectedProvider === 'Otro' 
      ? customProvider.trim() || 'Otro'
      : selectedProvider

    onConfirm({
      shipping_provider: finalProvider,
      tracking_number: trackingNumber.trim(),
      tracking_url: trackingUrl.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Marcar como Enviado
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Datos de la orden */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pedido:</span>
              <span className="font-mono text-gray-900">#{shortId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cliente:</span>
              <span className="text-gray-900 font-medium">{order.customer_name}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Producto:</span>
              <div className="text-gray-900 mt-1">{productName}</div>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Dirección:</span>
              <div className="text-gray-900 mt-1 text-xs bg-gray-50 p-2 rounded">
                {address}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Form */}
          <div className="space-y-4">
            {/* Paquetería */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paquetería / Proveedor <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Seleccionar paquetería...</option>
                {SHIPPING_PROVIDERS.map(provider => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom provider (si se selecciona "Otro") */}
            {selectedProvider === 'Otro' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de paquetería
                </label>
                <input
                  type="text"
                  value={customProvider}
                  onChange={(e) => setCustomProvider(e.target.value)}
                  disabled={loading}
                  placeholder="Ej: Correos de México"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* Tracking number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de tracking <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                disabled={loading}
                placeholder="Ej: 1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
              />
            </div>

            {/* Tracking URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de tracking (opcional)
              </label>
              <input
                type="url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                disabled={loading}
                placeholder="Ej: https://dhl.com/track/1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Si se deja vacío, el sistema puede generar automáticamente la URL si está soportada.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !isValid()}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Procesando...
              </>
            ) : (
              'Confirmar envío'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
