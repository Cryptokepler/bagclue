'use client'

import Link from 'next/link'

interface CustomerProfile {
  id: string
  user_id: string
  email: string
  name: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

interface AccountDashboardProps {
  profile: CustomerProfile
}

export default function AccountDashboard({ profile }: AccountDashboardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Bienvenido! 👋
        </h1>
        <p className="text-gray-600">
          Aquí podrás ver tus pedidos, apartados y gestionar tu cuenta.
        </p>
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Información de la cuenta
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <p className="text-gray-900">{profile.email}</p>
          </div>

          {profile.name && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <p className="text-gray-900">{profile.name}</p>
            </div>
          )}

          {profile.phone && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <p className="text-gray-900">{profile.phone}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Miembro desde
            </label>
            <p className="text-gray-900">{formatDate(profile.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          href="/account/orders"
          className="bg-white rounded-lg p-6 border border-gray-200 hover:border-[#FF69B4] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              📦 Mis Pedidos
            </h3>
            <span className="text-[#FF69B4] opacity-0 group-hover:opacity-100 transition-opacity">
              →
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Ver el historial completo de tus compras
          </p>
        </Link>

        <Link 
          href="/account/layaways"
          className="bg-white rounded-lg p-6 border border-gray-200 hover:border-[#FF69B4] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              🏷️ Mis Apartados
            </h3>
            <span className="text-[#FF69B4] opacity-0 group-hover:opacity-100 transition-opacity">
              →
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Gestionar tus productos apartados
          </p>
        </Link>
      </div>
    </div>
  )
}
