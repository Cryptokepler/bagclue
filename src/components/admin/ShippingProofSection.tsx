'use client'

import { useState } from 'react'
import { uploadShippingProof, deleteShippingProof } from '@/lib/supabase-upload-shipping'

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const hasProof = !!currentProof.url

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
      // PASO 1: Upload archivo
      console.log('[PROOF SECTION] Uploading file...')
      const uploadResult = await uploadShippingProof(orderId, selectedFile)

      if ('error' in uploadResult) {
        setFileError(uploadResult.error)
        setUploading(false)
        return
      }

      console.log('[PROOF SECTION] File uploaded successfully')

      // PASO 2: Update orden con proof metadata
      const response = await fetch(`/api/orders/${orderId}/shipping`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping_proof_url: uploadResult.url,
          shipping_proof_file_name: uploadResult.fileName,
          shipping_proof_file_type: uploadResult.fileType,
          shipping_proof_file_size: uploadResult.fileSize,
          shipping_proof_uploaded_at: new Date().toISOString()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[PROOF SECTION] Order update failed:', data.error)
        
        // Rollback: eliminar archivo subido
        console.log('[PROOF SECTION] Rolling back: deleting uploaded file')
        await deleteShippingProof(orderId, selectedFile.name)
        
        throw new Error(data.error || 'Error al guardar comprobante')
      }

      console.log('[PROOF SECTION] Order updated successfully')

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
      console.error('[PROOF SECTION] Upload error:', error.message)
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

      {hasProof ? (
        // YA EXISTE COMPROBANTE
        <div className="space-y-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📄</span>
              <div className="flex-1 min-w-0">
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
              </div>
            </div>
            <a
              href={currentProof.url!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors text-sm font-medium"
            >
              <span>📄</span>
              Ver Comprobante
            </a>
          </div>
          
          {currentProof.uploadedAt && (
            <div className="text-xs text-gray-500">
              Subido: {new Date(currentProof.uploadedAt).toLocaleString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}

          {/* Opcional: Botón para reemplazar */}
          <details className="text-sm text-gray-400">
            <summary className="cursor-pointer hover:text-white">Reemplazar comprobante</summary>
            <div className="mt-3 p-3 bg-white/5 border border-[#FF69B4]/10 rounded">
              <p className="text-xs text-gray-500 mb-3">
                Selecciona un nuevo archivo para reemplazar el comprobante actual.
              </p>
              {/* Reutilizar lógica de upload */}
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
        </div>
      ) : (
        // NO HAY COMPROBANTE - CTA PARA SUBIR
        <div className="space-y-4">
          <div className="text-center py-6 border-2 border-dashed border-[#FF69B4]/20 rounded">
            <div className="text-gray-500 text-sm mb-4">
              Sin comprobante cargado
            </div>

            {!selectedFile ? (
              <label className="inline-block">
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                />
                <span className="px-6 py-3 bg-[#FF69B4] text-white rounded cursor-pointer hover:bg-[#FF69B4]/90 transition-colors text-sm font-medium inline-block">
                  📄 Subir comprobante de envío
                </span>
              </label>
            ) : (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded p-3 inline-block">
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <span>✓</span>
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-green-600">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-6 py-2 bg-[#FF69B4] text-white rounded hover:bg-[#FF69B4]/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Subiendo...' : 'Guardar comprobante'}
                  </button>
                  <button
                    onClick={handleClear}
                    disabled={uploading}
                    className="px-4 py-2 bg-white/10 text-gray-400 rounded hover:bg-white/20 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-3">
              Formatos: JPG, PNG, PDF • Máximo: 5 MB
            </p>
          </div>

          {fileError && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-400 text-sm rounded">
              ⚠️ {fileError}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
