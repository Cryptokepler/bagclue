'use client'

import type { Address } from '@/types/address'

interface AddressCardProps {
  address: Address
  onEdit: (address: Address) => void
  onDelete: (addressId: string) => void
  onSetDefault: (addressId: string) => void
  isDeleting?: boolean
  isSettingDefault?: boolean
}

export default function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isDeleting = false,
  isSettingDefault = false
}: AddressCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Badge Principal */}
      {address.is_default && (
        <div className="mb-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
            🏠 Principal
          </span>
        </div>
      )}
      
      {/* Nombre */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {address.full_name}
      </h3>
      
      {/* Teléfono */}
      {address.phone && (
        <p className="text-sm text-gray-600 mb-3">
          {address.phone_country_code} ({address.phone_country_iso}) {address.phone}
        </p>
      )}
      
      {/* Dirección */}
      <div className="text-sm text-gray-700 space-y-1 mb-4">
        <p>{address.address_line1}</p>
        {address.address_line2 && <p>{address.address_line2}</p>}
        <p>
          {address.city}
          {address.state && `, ${address.state}`}
          {address.postal_code && ` ${address.postal_code}`}
        </p>
        <p>{address.country}</p>
        
        {address.delivery_references && (
          <p className="text-gray-500 mt-2 pt-2 border-t border-gray-100">
            Ref: {address.delivery_references}
          </p>
        )}
      </div>
      
      {/* Botones de acción */}
      <div className="flex flex-wrap gap-2">
        {/* Solo mostrar "Marcar como principal" si no es default */}
        {!address.is_default && (
          <button
            onClick={() => onSetDefault(address.id)}
            disabled={isSettingDefault}
            className="px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSettingDefault ? 'Actualizando...' : 'Marcar como principal'}
          </button>
        )}
        
        <button
          onClick={() => onEdit(address)}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          Editar
        </button>
        
        <button
          onClick={() => onDelete(address.id)}
          disabled={isDeleting}
          className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isDeleting ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </div>
  )
}
