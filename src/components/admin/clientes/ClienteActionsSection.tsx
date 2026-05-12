'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ClienteProfile } from '@/types/admin-clientes'

interface Props {
  profile: ClienteProfile
  hasOrders: boolean
  hasLayaways: boolean
}

export default function ClienteActionsSection({ profile, hasOrders, hasLayaways }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [showUnarchiveModal, setShowUnarchiveModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const isArchived = !!profile.archived_at
  const hasHistory = hasOrders || hasLayaways

  const handleArchive = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const clientId = profile.user_id || profile.email
      const response = await fetch(`/api/admin/clientes/${encodeURIComponent(clientId)}/archive`, {
        method: 'PATCH'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al archivar cliente')
      }

      // Redirect a lista de clientes
      router.push('/admin/clientes')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
      setShowArchiveModal(false)
    }
  }

  const handleUnarchive = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const clientId = profile.user_id || profile.email
      const response = await fetch(`/api/admin/clientes/${encodeURIComponent(clientId)}/unarchive`, {
        method: 'PATCH'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al activar cliente')
      }

      // Refresh page
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
      setShowUnarchiveModal(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const clientId = profile.user_id || profile.email
      const response = await fetch(`/api/admin/clientes/${encodeURIComponent(clientId)}/delete`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.hasHistory) {
          setError(`${data.error}\n\nPedidos: ${data.order_count || 0}, Apartados: ${data.layaway_count || 0}`)
        } else {
          throw new Error(data.error || 'Error al eliminar cliente')
        }
        setIsLoading(false)
        return
      }

      // Redirect a lista de clientes
      router.push('/admin/clientes')
    } catch (err: any) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
      <h2 className="text-lg text-white font-medium mb-4">Acciones</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-300 text-sm whitespace-pre-line">
          ❌ {error}
        </div>
      )}

      <div className="space-y-3">
        {!isArchived ? (
          <button
            onClick={() => setShowArchiveModal(true)}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            📦 Archivar cliente
          </button>
        ) : (
          <button
            onClick={() => setShowUnarchiveModal(true)}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            ✅ Activar cliente
          </button>
        )}

        {!hasHistory && (
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            🗑️ Eliminar cliente permanentemente
          </button>
        )}

        {hasHistory && (
          <div className="p-4 bg-gray-500/10 border border-gray-500/30 text-gray-400 text-sm">
            ℹ️ Este cliente tiene historial comercial ({hasOrders ? 'pedidos' : ''}{hasOrders && hasLayaways ? ' y ' : ''}{hasLayaways ? 'apartados' : ''}). No se puede eliminar, pero puedes archivarlo.
          </div>
        )}
      </div>

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-[#FF69B4]/30 p-6 max-w-md w-full">
            <h3 className="text-xl text-white font-medium mb-4">⚠️ ¿Archivar cliente?</h3>
            <div className="text-gray-300 mb-6 space-y-2">
              <p>El cliente <strong>{profile.name || profile.email}</strong> no se eliminará, pero:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>No aparecerá en el listado principal</li>
                <li>Se podrá ver con filtro &quot;Archivados&quot;</li>
                <li>Su historial permanece intacto</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowArchiveModal(false)}
                disabled={isLoading}
                className="flex-1 px-6 py-2 bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleArchive}
                disabled={isLoading}
                className="flex-1 px-6 py-2 bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Archivando...' : 'Archivar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unarchive Modal */}
      {showUnarchiveModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-[#FF69B4]/30 p-6 max-w-md w-full">
            <h3 className="text-xl text-white font-medium mb-4">✅ ¿Activar cliente?</h3>
            <div className="text-gray-300 mb-6">
              <p>El cliente <strong>{profile.name || profile.email}</strong> volverá a aparecer en el listado principal.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnarchiveModal(false)}
                disabled={isLoading}
                className="flex-1 px-6 py-2 bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUnarchive}
                disabled={isLoading}
                className="flex-1 px-6 py-2 bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Activando...' : 'Activar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-red-500/30 p-6 max-w-md w-full">
            <h3 className="text-xl text-white font-medium mb-4">🗑️ ¿Eliminar permanentemente?</h3>
            <div className="text-gray-300 mb-6 space-y-2">
              <p className="text-red-300 font-medium">⚠️ Esta acción NO se puede deshacer.</p>
              <p>Se eliminarán:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Perfil del cliente</li>
                <li>Direcciones guardadas</li>
              </ul>
              <p className="text-sm text-gray-400 mt-3">Cliente: <strong>{profile.name || profile.email}</strong></p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isLoading}
                className="flex-1 px-6 py-2 bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 px-6 py-2 bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Eliminando...' : 'Eliminar permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
