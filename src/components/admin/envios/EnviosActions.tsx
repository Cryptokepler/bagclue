'use client'

import { useRouter } from 'next/navigation'
import { EnviosOrder } from '@/types/admin-envios'

interface EnviosActionsProps {
  order: EnviosOrder
  onActionComplete?: () => void
}

export default function EnviosActions({ order, onActionComplete }: EnviosActionsProps) {
  const router = useRouter()

  // Handler dummy para botones (no ejecuta cambios reales)
  const handleDummyAction = (action: string) => {
    console.log(`[DUMMY] Acción: ${action}, Orden: ${order.id}`)
    // TODO: Implementar en SUBFASE 1C.3, 1C.4, 1C.5
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
          onClick={() => handleDummyAction('marcar_preparando')}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          Marcar preparando
        </button>
      )}

      {/* MARCAR ENVIADO - Solo si preparing */}
      {isPreparing && (
        <button
          onClick={() => handleDummyAction('marcar_enviado')}
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
  )
}
