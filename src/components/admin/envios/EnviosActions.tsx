'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EnviosOrder } from '@/types/admin-envios'
import MarcarPreparandoModal from './MarcarPreparandoModal'
import MarcarEnviadoModal from './MarcarEnviadoModal'

interface EnviosActionsProps {
  order: EnviosOrder
  onActionComplete?: () => void
}

export default function EnviosActions({ order, onActionComplete }: EnviosActionsProps) {
  const router = useRouter()
  const [showMarcarPreparandoModal, setShowMarcarPreparandoModal] = useState(false)
  const [showMarcarEnviadoModal, setShowMarcarEnviadoModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handler para marcar como preparando
  const handleMarcarPreparando = () => {
    setShowMarcarPreparandoModal(true)
    setError(null)
  }

  // Handler para confirmar marcar como preparando
  const handleConfirmMarcarPreparando = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/orders/${order.id}/shipping`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipping_status: 'preparing',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al actualizar estado' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      // Éxito: cerrar modal y refrescar datos
      setShowMarcarPreparandoModal(false)
      if (onActionComplete) {
        onActionComplete()
      }
    } catch (err) {
      console.error('Error al marcar como preparando:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Handler para marcar como enviado
  const handleMarcarEnviado = () => {
    setShowMarcarEnviadoModal(true)
    setError(null)
  }

  // Handler para confirmar marcar como enviado
  const handleConfirmMarcarEnviado = async (data: {
    shipping_provider: string
    tracking_number: string
    tracking_url?: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      const payload: any = {
        shipping_status: 'shipped',
        shipping_provider: data.shipping_provider,
        tracking_number: data.tracking_number,
      }

      if (data.tracking_url) {
        payload.tracking_url = data.tracking_url
      }

      const response = await fetch(`/api/orders/${order.id}/shipping`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al actualizar estado' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      // Éxito: cerrar modal y refrescar datos
      setShowMarcarEnviadoModal(false)
      if (onActionComplete) {
        onActionComplete()
      }
    } catch (err) {
      console.error('Error al marcar como enviado:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Handler dummy para botones (no ejecuta cambios reales)
  const handleDummyAction = (action: string) => {
    console.log(`[DUMMY] Acción: ${action}, Orden: ${order.id}`)
    // TODO: Implementar en SUBFASE 1C.4, 1C.5
  }

  // Determinar si la orden tiene dirección confirmada
  const hasAddress = Boolean(order.shipping_address)

  // Determinar estado actual
  const isPendingWithAddress = order.shipping_status === 'pending' && hasAddress
  const isPendingWithoutAddress = order.shipping_status === 'pending' && !hasAddress
  const isPreparing = order.shipping_status === 'preparing'
  const isShipped = order.shipping_status === 'shipped'
  const isDelivered = order.shipping_status === 'delivered'

  return (
    <>
      <div className="flex items-center gap-2">
        {/* VER DETALLE - SIEMPRE VISIBLE */}
        <button
          onClick={() => router.push(`/admin/orders/${order.id}`)}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          Ver detalle
        </button>

        {/* MARCAR PREPARANDO - Solo si pending con dirección */}
        {isPendingWithAddress && (
          <button
            onClick={handleMarcarPreparando}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Marcar preparando
          </button>
        )}

        {/* MARCAR ENVIADO - Solo si preparing */}
        {isPreparing && (
          <button
            onClick={handleMarcarEnviado}
            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
          >
            Marcar enviado
          </button>
        )}

        {/* EDITAR TRACKING - Solo si shipped */}
        {isShipped && (
          <button
            onClick={() => handleDummyAction('editar_tracking')}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Editar tracking
          </button>
        )}

        {/* MARCAR ENTREGADO - Solo si shipped */}
        {isShipped && (
          <button
            onClick={() => handleDummyAction('marcar_entregado')}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            Marcar entregado
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
          {error}
        </div>
      )}

      {/* Modal: Marcar preparando */}
      {showMarcarPreparandoModal && (
        <MarcarPreparandoModal
          order={order}
          onConfirm={handleConfirmMarcarPreparando}
          onClose={() => setShowMarcarPreparandoModal(false)}
          loading={loading}
        />
      )}

      {/* Modal: Marcar enviado */}
      {showMarcarEnviadoModal && (
        <MarcarEnviadoModal
          order={order}
          onConfirm={handleConfirmMarcarEnviado}
          onClose={() => setShowMarcarEnviadoModal(false)}
          loading={loading}
        />
      )}
    </>
  )
}
