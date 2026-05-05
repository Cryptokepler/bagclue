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
  
  return (
    <div className="relative flex-1 max-w-md">
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-[#FF69B4]/20 text-white placeholder-gray-500 px-4 py-2 focus:outline-none focus:border-[#FF69B4] transition-colors"
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
  )
}
