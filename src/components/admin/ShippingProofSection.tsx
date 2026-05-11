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
  // PASO B: Caja estática sin datos
  return (
    <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
      <h2 className="text-lg text-white font-medium mb-4">Comprobante de envío</h2>
      
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-4">
        <div className="text-sm text-emerald-400 font-medium">
          Comprobante disponible
        </div>
        <div className="text-xs text-gray-500 mt-2">
          [PRUEBA B] Caja estática sin datos
        </div>
      </div>
    </div>
  )
}
