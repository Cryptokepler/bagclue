'use client'

import { useState } from 'react'
import type { ClienteProfile } from '@/types/admin-clientes'

interface Props {
  profile: ClienteProfile
  onSaved: () => void
}

export default function ClienteNotesSection({ profile, onSaved }: Props) {
  const [notes, setNotes] = useState(profile.internal_notes || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const clientId = profile.user_id || profile.email
      const response = await fetch(`/api/admin/clientes/${encodeURIComponent(clientId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internal_notes: notes })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar notas')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const isModified = notes !== (profile.internal_notes || '')
  const charCount = notes.length
  const maxChars = 1000
  const isOverLimit = charCount > maxChars

  return (
    <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
      <div className="mb-4">
        <h2 className="text-lg text-white font-medium mb-1">Notas Internas</h2>
        <p className="text-sm text-gray-400">Solo visible para administradores</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm">
          ✅ Notas guardadas correctamente
        </div>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className={`w-full h-32 bg-white/10 border ${
          isOverLimit ? 'border-red-500/50' : 'border-white/20'
        } text-white p-3 focus:outline-none focus:border-[#FF69B4] resize-none`}
        placeholder="Ej: Cliente VIP, mayorista. Atención especial en envíos. Preferencia por pago contra entrega."
      />

      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-gray-500'}`}>
          {charCount}/{maxChars} caracteres
          {isOverLimit && ' (excede el límite)'}
        </span>
        <button
          onClick={handleSave}
          disabled={isLoading || !isModified || isOverLimit}
          className="px-6 py-2 bg-[#FF69B4] text-white hover:bg-[#FF1493] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Guardando...' : 'Guardar notas'}
        </button>
      </div>

      {!profile.user_id && isModified && (
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
          ℹ️ Se creará una ficha interna para este cliente invitado al guardar.
        </div>
      )}
    </div>
  )
}
