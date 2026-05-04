'use client'

import { EnviosOrder } from '@/types/admin-envios'

interface MarcarEntregadoModalProps {
  order: EnviosOrder
  onConfirm: () => void
  onClose: () => void
  loading?: boolean
}

export default function MarcarEntregadoModal({
  order,
  onConfirm,
  onClose,
  loading = false
}: MarcarEntregadoModalProps) {
  // Formatear ID corto (últimos 8 caracteres)
  const shortId = order.id.slice(-8).toUpperCase()

  // Obtener producto principal
  const mainProduct = order.order_items?.[0]
  const productName = mainProduct
    ? `${mainProduct.product_snapshot.brand} ${mainProduct.product_snapshot.title}`
    : 'Sin producto'

  // Formatear paquetería
  const providerDisplay = order.shipping_provider
    ? order.shipping_provider === 'dhl'
      ? 'DHL'
      : order.shipping_provider === 'fedex'
      ? 'FedEx'
      : order.shipping_provider === 'manual'
      ? 'Otro'
      : order.shipping_provider
    : 'Sin paquetería'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Marcar como Entregado
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
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Paquetería:</span>
              <span className="text-gray-900 font-medium">{providerDisplay}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tracking:</span>
              <span className="text-gray-900 font-mono text-xs">
                {order.tracking_number || 'Sin tracking'}
              </span>
            </div>
          </div>

          {/* Warning message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">
                  Acción irreversible
                </p>
                <p className="text-sm text-red-800">
                  Esta acción marcará el pedido como <strong>entregado</strong> y no puede revertirse desde esta vista.
                </p>
              </div>
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
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirmar entrega
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
