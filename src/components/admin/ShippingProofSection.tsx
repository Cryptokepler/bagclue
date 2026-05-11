'use client'

import { useState, useEffect } from 'react'
import ClientDate from '@/components/ClientDate'

interface ShippingProofSectionProps {
  orderId: string
  currentProof: {
    url: string | null
    fileName: string | null
    fileSize: number | null
    uploadedAt: string | null
  }
  onSuccess?: () => void
}

export default function ShippingProofSection({ orderId, currentProof, onSuccess }: ShippingProofSectionProps) {
  // PASO A: Desactivar completamente - solo placeholder
  return (
    <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
      <h2 className="text-lg text-white font-medium mb-4">Comprobante de envío</h2>
      <div className="text-sm text-gray-400">
        [PRUEBA A] Componente desactivado - placeholder estático
      </div>
    </div>
  )
}
