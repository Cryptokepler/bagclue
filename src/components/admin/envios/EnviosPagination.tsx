'use client'

import { EnviosPagination as PaginationType } from '@/types/admin-envios'

interface EnviosPaginationProps {
  pagination: PaginationType
  onPageChange: (newOffset: number) => void
}

export default function EnviosPagination({ pagination, onPageChange }: EnviosPaginationProps) {
  const { total, limit, offset, hasMore } = pagination

  const currentStart = offset + 1
  const currentEnd = Math.min(offset + limit, total)
  const hasPrevious = offset > 0

  const handlePrevious = () => {
    if (hasPrevious) {
      onPageChange(Math.max(0, offset - limit))
    }
  }

  const handleNext = () => {
    if (hasMore) {
      onPageChange(offset + limit)
    }
  }

  return (
    <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={handlePrevious}
          disabled={!hasPrevious}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <button
          onClick={handleNext}
          disabled={!hasMore}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{currentStart}</span> - <span className="font-medium">{currentEnd}</span> de{' '}
            <span className="font-medium">{total}</span> resultados
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={handlePrevious}
              disabled={!hasPrevious}
              className="relative inline-flex items-center rounded-l-md px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={handleNext}
              disabled={!hasMore}
              className="relative inline-flex items-center rounded-r-md px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
