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

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

export default function ShippingProofSection({ orderId, currentProof, onSuccess }: ShippingProofSectionProps) {
  // PASO G: Reincorporar "Reemplazar comprobante"
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  
  const hasProof = !!(currentProof.fileName && currentProof.fileSize)
  
  // Validar archivo
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Formato no válido. Solo JPG, PNG o PDF.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Archivo demasiado grande. Máximo 5 MB. (Tamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB)`
    }
    return null
  }

  // Manejar selección
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      setFileError(null)
      return
    }

    const error = validateFile(file)
    if (error) {
      setFileError(error)
      setSelectedFile(null)
    } else {
      setSelectedFile(file)
      setFileError(null)
      setUploadSuccess(false)
    }
  }

  // Limpiar selección
  const handleClear = () => {
    setSelectedFile(null)
    setFileError(null)
    setUploadSuccess(false)
  }

  // Subir archivo
  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setFileError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(`/api/orders/${orderId}/upload-proof`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir comprobante')
      }

      // Éxito
      setUploadSuccess(true)
      setSelectedFile(null)
      setUploading(false)

      // Refrescar página para mostrar nuevo estado
      if (onSuccess) {
        onSuccess()
      } else {
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch (error: any) {
      setFileError(error.message || 'Error al subir. Intenta de nuevo.')
      setUploading(false)
    }
  }
  
  return (
    <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
      <h2 className="text-lg text-white font-medium mb-4">Comprobante de envío</h2>
      
      {uploadSuccess && (
        <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-sm rounded">
          ✅ Comprobante subido correctamente. Refrescando...
        </div>
      )}
      
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
      </div>
      
      {hasProof && (
        <details className="mt-4 text-sm text-gray-400">
          <summary className="cursor-pointer hover:text-white">Reemplazar comprobante</summary>
          <div className="mt-3 p-3 bg-white/5 border border-[#FF69B4]/10 rounded">
            <p className="text-xs text-gray-500 mb-3">
              Selecciona un nuevo archivo para reemplazar el comprobante actual.
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleFileSelect}
              disabled={uploading}
              className="text-sm text-gray-400"
            />
            {selectedFile && !fileError && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-4 py-2 bg-[#FF69B4] text-white rounded text-sm hover:bg-[#FF69B4]/90 disabled:opacity-50"
                >
                  {uploading ? 'Subiendo...' : 'Guardar nuevo'}
                </button>
                <button
                  onClick={handleClear}
                  disabled={uploading}
                  className="px-4 py-2 bg-white/10 text-gray-400 rounded text-sm hover:bg-white/20"
                >
                  Cancelar
                </button>
              </div>
            )}
            {fileError && (
              <div className="mt-2 text-sm text-red-400">
                ⚠️ {fileError}
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  )
}
