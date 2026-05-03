'use client'

export default function AddressEmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="mb-6">
        <svg 
          className="mx-auto h-24 w-24 text-gray-300" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1} 
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1} 
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
          />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No tienes direcciones guardadas
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Agrega una dirección de envío para agilizar tus compras futuras.
      </p>
      
      <button
        onClick={onAddClick}
        className="inline-flex items-center justify-center px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium"
      >
        + Agregar dirección
      </button>
    </div>
  )
}
