'use client'

import { useState, useEffect } from 'react'

interface ClientDateProps {
  date: string | Date
  className?: string
}

export default function ClientDate({ date, className }: ClientDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>('')

  useEffect(() => {
    // Solo renderiza en cliente para evitar hydration mismatch
    const formatted = new Date(date).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    setFormattedDate(formatted)
  }, [date])

  // Durante SSR o antes de hidratación, muestra placeholder vacío
  if (!formattedDate) {
    return <span className={className}>Cargando...</span>
  }

  return <span className={className}>{formattedDate}</span>
}
