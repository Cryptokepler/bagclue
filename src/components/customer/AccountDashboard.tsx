'use client'

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

      {/* Coming Soon Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📦 Mis Pedidos
          </h3>
          <p className="text-sm text-gray-600">
            Próximamente podrás ver el historial de tus pedidos aquí.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🏷️ Mis Apartados
          </h3>
          <p className="text-sm text-gray-600">
            Próximamente podrás gestionar tus apartados aquí.
          </p>
        </div>
      </div>
    </div>
  )
}
