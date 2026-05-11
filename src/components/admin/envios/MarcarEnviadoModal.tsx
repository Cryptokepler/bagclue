'use client'

import { useState } from 'react'
import { EnviosOrder } from '@/types/admin-envios'
import { uploadShippingProof, deleteShippingProof, ShippingProofUploadResult } from '@/lib/supabase-upload-shipping'

interface MarcarEnviadoModalProps {
  order: EnviosOrder
  onConfirm: (data: {
    shipping_provider: string
    tracking_number: string
    tracking_url?: string
    shipping_proof_url?: string
    shipping_proof_file_name?: string
    shipping_proof_file_type?: string
    shipping_proof_file_size?: number
    shipping_proof_uploaded_at?: string
  }) => void
  onClose: () => void
  loading?: boolean
}

const SHIPPING_PROVIDERS = [
  { value: 'dhl', label: 'DHL' },
  { value: 'fedex', label: 'FedEx' },
  { value: 'manual', label: 'Otro' },
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

export default function MarcarEnviadoModal({
  order,
  onConfirm,
  onClose,
  loading = false
}: MarcarEnviadoModalProps) {
  const [selectedProvider, setSelectedProvider] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  
  // Shipping proof states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Formatear ID corto (últimos 8 caracteres)
  const shortId = order.id.slice(-8).toUpperCase()

  // Obtener producto principal
  const mainProduct = order.order_items?.[0]
  const productName = mainProduct
    ? `${mainProduct.product_snapshot.brand} ${mainProduct.product_snapshot.title}`
    : 'Sin producto'

  // Formatear dirección (primeras 60 caracteres)
  const address = order.shipping_address
    ? order.shipping_address.length > 60
      ? order.shipping_address.slice(0, 57) + '...'
      : order.shipping_address
    : 'Sin dirección'

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

  // Manejar selección de archivo
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
    }
  }

  // Limpiar archivo seleccionado
  const handleClearFile = () => {
    setSelectedFile(null)
    setFileError(null)
  }

  // Validar form
  const isValid = () => {
    if (!selectedProvider) return false
    if (!trackingNumber.trim()) return false
    if (fileError) return false
    return true
  }

  // Enviar form
  const handleSubmit = async () => {
    if (!isValid()) return

    setUploading(true)

    let proofData: ShippingProofUploadResult | null = null

    try {
      // PASO 1: Upload archivo (si existe)
      if (selectedFile) {
        console.log('[MODAL] Uploading shipping proof...')
        const uploadResult = await uploadShippingProof(order.id, selectedFile)

        if ('error' in uploadResult) {
          setFileError(uploadResult.error)
          setUploading(false)
          return
        }

        proofData = uploadResult
        console.log('[MODAL] Shipping proof uploaded successfully')
      }

      // PASO 2: Llamar onConfirm con datos (incluye proof si existe)
      await onConfirm({
        shipping_provider: selectedProvider,
        tracking_number: trackingNumber.trim(),
        tracking_url: trackingUrl.trim() || undefined,
        ...(proofData && {
          shipping_proof_url: proofData.url,
          shipping_proof_file_name: proofData.fileName,
          shipping_proof_file_type: proofData.fileType,
          shipping_proof_file_size: proofData.fileSize,
          shipping_proof_uploaded_at: new Date().toISOString()
        })
      })

      // onConfirm es responsable de cerrar modal y refrescar tabla
    } catch (error: any) {
      console.error('[MODAL] Submit error:', error.message)

      // Rollback: Eliminar archivo si update falló
      if (proofData && selectedFile) {
        console.log('[MODAL] Rolling back: deleting uploaded file')
        await deleteShippingProof(order.id, selectedFile.name)
      }

      setFileError('Error al procesar. Intenta de nuevo.')
      setUploading(false)
    }
  }

  const isProcessing = loading || uploading

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Marcar como Enviado
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Datos de la orden */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pedido:</span>
              <span className="font-mono text-gray-900">#{shortId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cliente:</span>
              <span className="text-gray-900 font-medium">{order.customer_name}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Producto:</span>
              <div className="text-gray-900 mt-1">{productName}</div>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Dirección:</span>
              <div className="text-gray-900 mt-1 text-xs bg-gray-50 p-2 rounded">
                {address}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Form */}
          <div className="space-y-4">
            {/* Paquetería */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paquetería / Proveedor <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                disabled={isProcessing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Seleccionar paquetería...</option>
                {SHIPPING_PROVIDERS.map(provider => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tracking number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de tracking <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                disabled={isProcessing}
                placeholder="Ej: 1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
              />
            </div>

            {/* Tracking URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de tracking (opcional)
              </label>
              <input
                type="text"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                disabled={isProcessing}
                placeholder="https://... (opcional, se puede dejar vacío)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Dejar vacío para que el sistema genere automáticamente la URL de DHL/FedEx.
              </p>
            </div>

            {/* Comprobante de envío */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comprobante / guía de envío (opcional)
              </label>
              
              {!selectedFile ? (
                <div>
                  <label
                    className={`
                      flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer
                      transition-colors
                      ${isProcessing 
                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                        : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                      }
                    `}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={handleFileSelect}
                      disabled={isProcessing}
                      className="hidden"
                    />
                    <span className="text-sm text-gray-600">
                      📄 Seleccionar archivo...
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos: JPG, PNG, PDF • Máximo: 5 MB
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm text-green-800">
                        <span className="text-lg">✓</span>
                        <span className="font-medium truncate">{selectedFile.name}</span>
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <button
                      onClick={handleClearFile}
                      disabled={isProcessing}
                      className="ml-2 text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {fileError && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  ⚠️ {fileError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !isValid()}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Procesando...
              </>
            ) : (
              'Confirmar envío'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
