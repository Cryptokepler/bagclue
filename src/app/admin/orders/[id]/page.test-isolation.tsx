'use client'

import { use } from 'react'

// TEST DE AISLAMIENTO — Sin componentes complejos
// Solo div básico para ver si el error viene del layout o del contenido

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white text-2xl">
        TEST ORDER PAGE - ID: {id}
      </div>
    </div>
  )
}
