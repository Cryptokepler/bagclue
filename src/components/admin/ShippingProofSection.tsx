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
  // PASO F: Agregar botón Ver Comprobante con endpoint estable
  const hasProof = !!(currentProof.fileName && currentProof.fileSize)
  
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
        
        {hasProof && (
          <div className="mt-3">
            <a
              href={`/api/admin/orders/${orderId}/shipping-proof/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors text-sm font-medium"
            >
              <span>📄</span>
              Ver Comprobante
            </a>
          </div>
        )}
        
        <div className="text-xs text-gray-500 mt-2">
          [PRUEBA F] Con botón Ver Comprobante (endpoint estable)
        </div>
      </div>
    </div>
  )
}
