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
  // PASO E: Agregar uploadedAt con ClientDate
  return (
    <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
      <h2 className="text-lg text-white font-medium mb-4">Comprobante de envío</h2>
      
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-4">
        <div className="text-sm text-emerald-400 font-medium">
          Comprobante disponible
        </div>
        {currentProof.fileName && (
          <div className="text-xs text-gray-400 mt-1 truncate">
            {currentProof.fileName}
          </div>
        )}
        {currentProof.fileSize && (
          <div className="text-xs text-gray-500 mt-1">
            {(currentProof.fileSize / 1024).toFixed(1)} KB
          </div>
        )}
        {currentProof.uploadedAt && (
          <div className="text-xs text-gray-500 mt-1">
            Subido: <ClientDate date={currentProof.uploadedAt} />
          </div>
        )}
        <div className="text-xs text-gray-500 mt-2">
          [PRUEBA E] Con fileName + fileSize + uploadedAt
        </div>
      </div>
    </div>
  )
}
