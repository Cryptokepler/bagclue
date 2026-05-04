'use client'

import { useState, useEffect } from 'react'

interface EnviosSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function EnviosSearchBar({ value, onChange, placeholder = 'Buscar por cliente, email o tracking...' }: EnviosSearchBarProps) {
  const [localValue, setLocalValue] = useState(value)
  const [isSearching, setIsSearching] = useState(false)
  const debouncedValue = useDebounce(localValue, 300)

  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue)
      setIsSearching(false)
    }
  }, [debouncedValue])

  useEffect(() => {
    if (localValue !== debouncedValue) {
      setIsSearching(true)
    }
  }, [localValue])

  const handleClear = () => {
    setLocalValue('')
    onChange('')
    setIsSearching(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={localValue}
            onChange={e => setLocalValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {localValue && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {isSearching && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
