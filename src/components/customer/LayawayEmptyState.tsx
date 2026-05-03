'use client'

import Link from 'next/link'

export default function LayawayEmptyState() {
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
          />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No tienes apartados activos
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Aún no has creado ningún apartado. Explora nuestro catálogo y encuentra las piezas de lujo que te encantan.
      </p>
      
      <Link
        href="/catalogo"
        className="inline-flex items-center justify-center px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium"
      >
        Explorar catálogo →
      </Link>
    </div>
  )
}
