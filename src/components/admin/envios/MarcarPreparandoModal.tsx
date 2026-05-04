'use client'

import { EnviosOrder } from '@/types/admin-envios'

interface MarcarPreparandoModalProps {
  order: EnviosOrder
  onConfirm: () => void
  onClose: () => void
  loading?: boolean
}

export default function MarcarPreparandoModal({
  order,
  onConfirm,
  onClose,
  loading = false
}: MarcarPreparandoModalProps) {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Marcar como Preparando
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
              <span className="text-gray-500">Dirección confirmada:</span>
              <div className="text-gray-900 mt-1 text-xs bg-gray-50 p-2 rounded">
                {address}
              </div>
            </div>
          </div>

          {/* Warning message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Esta acción marcará el pedido como <strong>preparando</strong>. Aún no se enviará ni se generará tracking.
            </p>
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
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              'Confirmar'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
