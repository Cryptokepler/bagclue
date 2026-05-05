'use client'

// src/components/admin/ProductSearchBar.tsx
// Barra de búsqueda con debounce para productos

import { useState, useEffect } from 'react'

interface ProductSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function ProductSearchBar({ 
  value, 
  onChange, 
  placeholder = 'Buscar por título, marca o modelo...' 
}: ProductSearchBarProps) {
  const [localValue, setLocalValue] = useState(value)
  
  // Debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [localValue, onChange])
  
  // Sincronizar con valor externo si cambia
  useEffect(() => {
    setLocalValue(value)
  }, [value])
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onChange(localValue)
    }
  }
  
  const handleSearch = () => {
    onChange(localValue)
  }
  
  return (
    <div className="flex gap-2 flex-1 max-w-2xl">
      <div className="relative flex-1">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          🔍
        </div>
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-[#FF69B4]/20 text-white placeholder-gray-500 pl-10 pr-10 py-2 focus:outline-none focus:border-[#FF69B4] transition-colors"
        />
        {localValue && (
          <button
            onClick={() => setLocalValue('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>
      <button
        onClick={handleSearch}
        className="bg-[#FF69B4] text-[#0a0a0a] font-medium px-6 py-2 hover:bg-[#FF69B4]/90 transition-colors whitespace-nowrap"
      >
        Buscar
      </button>
    </div>
  )
}
