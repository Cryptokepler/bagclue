'use client'

import { useState } from 'react'
import type { ClienteProfile } from '@/types/admin-clientes'

interface Props {
  profile: ClienteProfile
  onSaved: () => void
}

export default function EditClienteForm({ profile, onSaved }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: profile.name || '',
    phone: profile.phone || '',
    phone_country_code: profile.phone_country_code || '',
    phone_country_iso: profile.phone_country_iso || ''
  })

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const clientId = profile.user_id || profile.email
      const response = await fetch(`/api/admin/clientes/${encodeURIComponent(clientId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar cambios')
      }

      setIsEditing(false)
      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: profile.name || '',
      phone: profile.phone || '',
      phone_country_code: profile.phone_country_code || '',
      phone_country_iso: profile.phone_country_iso || ''
    })
    setIsEditing(false)
    setError(null)
  }

  const formatPhone = () => {
    if (!profile.phone) return '-'
    if (profile.phone_country_code) {
      return `${profile.phone_country_code} ${profile.phone}`
    }
    return profile.phone
  }

  if (!isEditing) {
    return (
      <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg text-white font-medium">Perfil del Cliente</h2>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-[#FF69B4] text-white text-sm hover:bg-[#FF1493] transition-colors"
          >
            Editar
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">Nombre</div>
            <div className="text-white">{profile.name || '-'}</div>
          </div>

          <div>
            <div className="text-sm text-gray-400 mb-1">Email</div>
            <div className="text-white">{profile.email}</div>
            <div className="text-xs text-gray-500 mt-1">(No editable)</div>
          </div>

          <div>
            <div className="text-sm text-gray-400 mb-1">Teléfono</div>
            <div className="text-white">{formatPhone()}</div>
          </div>

          <div>
            <div className="text-sm text-gray-400 mb-1">Tipo</div>
            <div className="text-white">
              {profile.type === 'registered' ? (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm">
                  Cliente Registrado
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-500/20 text-gray-400 border border-gray-500/30 text-sm">
                  Cliente Guest (sin cuenta)
                </span>
              )}
            </div>
          </div>
        </div>

        {!profile.user_id && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
            ℹ️ Este es un cliente guest. Al editar sus datos, se creará una ficha interna automáticamente.
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg text-white font-medium">Editar Perfil del Cliente</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
          ❌ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Nombre</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-[#FF69B4]"
            placeholder="Nombre del cliente"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Email</label>
          <input
            type="text"
            value={profile.email}
            disabled
            className="w-full bg-white/5 border border-white/10 text-gray-500 px-3 py-2 cursor-not-allowed"
          />
          <div className="text-xs text-gray-500 mt-1">El email no se puede editar</div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Código de país</label>
          <input
            type="text"
            value={formData.phone_country_code}
            onChange={(e) => setFormData({ ...formData, phone_country_code: e.target.value })}
            className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-[#FF69B4]"
            placeholder="+52"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">ISO país</label>
          <input
            type="text"
            value={formData.phone_country_iso}
            onChange={(e) => setFormData({ ...formData, phone_country_iso: e.target.value.toUpperCase() })}
            className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-[#FF69B4]"
            placeholder="MX"
            maxLength={2}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-2">Teléfono</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-[#FF69B4]"
            placeholder="7223854524"
          />
        </div>
      </div>

      {!profile.user_id && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
          ℹ️ Se creará una ficha interna para este cliente invitado.
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-6 py-2 bg-[#FF69B4] text-white hover:bg-[#FF1493] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="px-6 py-2 bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
