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
    <div className="flex items-center justify-between bg-white/5 border border-[#FF69B4]/20 px-4 py-3">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={handlePrevious}
          disabled={!hasPrevious}
          className="relative inline-flex items-center border border-[#FF69B4]/20 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <button
          onClick={handleNext}
          disabled={!hasMore}
          className="relative ml-3 inline-flex items-center border border-[#FF69B4]/20 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-400">
            Mostrando <span className="font-medium text-white">{currentStart}</span> - <span className="font-medium text-white">{currentEnd}</span> de{' '}
            <span className="font-medium text-white">{total}</span> resultados
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px" aria-label="Pagination">
            <button
              onClick={handlePrevious}
              disabled={!hasPrevious}
              className="relative inline-flex items-center border-l border-y border-[#FF69B4]/20 px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={handleNext}
              disabled={!hasMore}
              className="relative inline-flex items-center border border-[#FF69B4]/20 px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
