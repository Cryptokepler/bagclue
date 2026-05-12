'use client'

import type { ClienteProfile as ClienteProfileType } from '@/types/admin-clientes'

interface Props {
  profile: ClienteProfileType
}

export default function ClienteProfile({ profile }: Props) {
  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatPhone = () => {
    if (!profile.phone) return '-'
    if (profile.phone_country_code) {
      return `${profile.phone_country_code} ${profile.phone}`
    }
    return profile.phone
  }

  return (
    <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
      <h2 className="text-lg text-white font-medium mb-4">Perfil del Cliente</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-400 mb-1">Nombre</div>
          <div className="text-white">{profile.name || '-'}</div>
        </div>

        <div>
          <div className="text-sm text-gray-400 mb-1">Email</div>
          <div className="text-white">{profile.email}</div>
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

        {profile.type === 'registered' ? (
          <>
            <div>
              <div className="text-sm text-gray-400 mb-1">Fecha de registro</div>
              <div className="text-white">{formatDate(profile.registered_at)}</div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-1">Welcome email</div>
              <div className="text-white">
                {profile.welcome_email_sent_at ? (
                  <span className="text-emerald-400">Enviado ({formatDate(profile.welcome_email_sent_at)})</span>
                ) : (
                  <span className="text-gray-400">No enviado</span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div>
            <div className="text-sm text-gray-400 mb-1">Primera compra</div>
            <div className="text-white">{formatDate(profile.first_purchase_at)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
