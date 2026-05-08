'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabaseCustomer } from '@/lib/supabase-customer'

interface BankConfig {
  bankName: string
  accountHolder: string
  clabe: string
  accountNumber?: string
  paymentInstructions?: string
}

interface TransactionData {
  transactionId: string
  orderId: string
  paymentReference: string
  amountMxn: number
  expiresAt: string
  transactionStatus: string
  trackingToken: string | null
  bankConfig: BankConfig
}

export default function BankTransferPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const transactionId = params?.transactionId as string
  const trackingToken = searchParams?.get('token')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<TransactionData | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [copiedClabe, setCopiedClabe] = useState(false)
  const [copiedReference, setCopiedReference] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (!transactionId) return

    async function fetchTransactionData() {
      try {
        // Validate tracking token presence
        if (!trackingToken) {
          throw new Error('No pudimos validar esta transacción. Revisa el enlace de pago o entra a tu cuenta.')
        }

        // Get session token if available
        const { data: { session } } = await supabaseCustomer.auth.getSession()
        const headers: HeadersInit = {}
        
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }

        // Fetch bank config and transaction data via API
        // Backend validates ownership via tracking_token
        const url = `/api/payments/bank-transfer/config?transaction_id=${transactionId}&token=${encodeURIComponent(trackingToken)}`
        const res = await fetch(url, { headers })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Error al cargar datos de pago')
        }

        const apiData = await res.json()
        
        // API now returns complete transaction data
        setData({
          transactionId: apiData.transactionId,
          orderId: apiData.orderId,
          paymentReference: apiData.paymentReference,
          amountMxn: apiData.amountMxn,
          expiresAt: apiData.expiresAt,
          transactionStatus: apiData.transactionStatus,
          trackingToken: apiData.trackingToken,
          bankConfig: apiData.bankConfig
        })
        
        // If proof already uploaded, mark as success
        if (apiData.transactionStatus === 'proof_uploaded' || apiData.transactionStatus === 'awaiting_approval') {
          setUploadSuccess(true)
        }
      } catch (err: any) {
        console.error('[BankTransfer] Error loading data:', err)
        setError(err.message || 'Error al cargar datos de pago')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactionData()
  }, [transactionId, trackingToken])

  const copyToClipboard = async (text: string, type: 'clabe' | 'reference') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'clabe') {
        setCopiedClabe(true)
        setTimeout(() => setCopiedClabe(false), 2000)
      } else {
        setCopiedReference(true)
        setTimeout(() => setCopiedReference(false), 2000)
      }
    } catch (err) {
      console.error('Error copying to clipboard:', err)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      setUploadError('')
      return
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      setUploadError('Solo se permiten archivos JPG, PNG o PDF')
      setSelectedFile(null)
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('El archivo debe ser menor a 5MB')
      setSelectedFile(null)
      return
    }

    // File is valid, save it
    setSelectedFile(file)
    setUploadError('')
  }

  const handleSubmitProof = async () => {
    if (!selectedFile) return

    setUploadingProof(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('transactionId', transactionId)
      
      // Include tracking_token for guest checkout ownership validation
      if (trackingToken) {
        formData.append('token', trackingToken)
      }

      const res = await fetch('/api/payments/bank-transfer/upload-proof', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const errorData = await res.json()
        
        // Friendly error messages based on backend response
        if (errorData.error === 'Invalid transaction status') {
          if (data?.transactionStatus === 'proof_uploaded' || data?.transactionStatus === 'awaiting_approval') {
            throw new Error('Ya recibimos un comprobante para esta transacción. Estamos validando tu pago.')
          } else if (data?.transactionStatus === 'confirmed') {
            throw new Error('Esta transacción ya fue confirmada.')
          } else if (data?.transactionStatus === 'rejected') {
            throw new Error('El comprobante anterior fue rechazado. Por favor, sube uno nuevo.')
          } else {
            throw new Error('No se puede subir comprobante para esta transacción.')
          }
        }
        
        throw new Error(errorData.message || errorData.error || 'Error al subir comprobante')
      }

      setUploadSuccess(true)
      setSelectedFile(null)
    } catch (err: any) {
      console.error('[BankTransfer] Error uploading proof:', err)
      setUploadError(err.message || 'Error al subir comprobante')
    } finally {
      setUploadingProof(false)
    }
  }

  if (loading) {
    return (
      <div className="pt-28 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85A9A] mx-auto mb-4"></div>
              <p className="text-sm text-gray-900/60">Cargando datos de pago...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="pt-28 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-4 mb-8">
            {error || 'Error al cargar datos de pago'}
          </div>
          <Link
            href="/catalogo"
            className="inline-block border border-[#E85A9A]/20 text-gray-900 px-8 py-3 hover:border-[#E85A9A] transition-colors"
          >
            Volver al Catálogo
          </Link>
        </div>
      </div>
    )
  }

  const expiresDate = new Date(data.expiresAt)
  const isExpired = expiresDate < new Date()

  return (
    <div className="pt-28 pb-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-gray-900 mb-3">
            Transferencia Bancaria
          </h1>
          <p className="text-sm text-gray-900/60">
            Tu pieza queda reservada mientras validamos tu pago.
          </p>
        </div>

        {/* Success Upload Banner - Proof Uploaded */}
        {uploadSuccess && data.transactionStatus !== 'confirmed' && (
          <div className="bg-emerald-50 border border-emerald-200 p-6 mb-8">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-emerald-800 mb-1">
                  Pago en revisión
                </h3>
                <p className="text-sm text-emerald-700">
                  Recibimos tu comprobante. Nuestro equipo validará el pago en banco.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Confirmed Banner */}
        {data.transactionStatus === 'confirmed' && (
          <div className="bg-green-50 border border-green-200 p-6 mb-8">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-green-800 mb-1">
                  Pago confirmado
                </h3>
                <p className="text-sm text-green-700">
                  Tu compra fue confirmada. Prepararemos tu envío pronto.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Expired Warning */}
        {isExpired && !uploadSuccess && (
          <div className="bg-amber-50 border border-amber-200 p-6 mb-8">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-medium text-amber-800 mb-1">
                  Orden expirada
                </h3>
                <p className="text-sm text-amber-700">
                  Esta orden ha expirado. Si ya realizaste la transferencia, contáctanos por Instagram.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Amount */}
        <div className="bg-[#E85A9A]/5 border border-[#E85A9A]/20 p-6 mb-8">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-900/60">Monto a transferir</span>
            <span className="text-3xl font-[family-name:var(--font-playfair)] text-[#E85A9A]">
              ${data.amountMxn.toLocaleString()} MXN
            </span>
          </div>
        </div>

        {/* Bank Instructions */}
        <div className="bg-white border-2 border-[#E85A9A]/20 p-6 md:p-8 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Datos para transferencia SPEI
          </h2>

          <div className="space-y-5">
            {/* Bank */}
            <div>
              <p className="text-xs text-gray-900/60 mb-1">Banco</p>
              <p className="text-base font-medium text-gray-900">{data.bankConfig.bankName}</p>
            </div>

            {/* Account Holder */}
            <div>
              <p className="text-xs text-gray-900/60 mb-1">Titular</p>
              <p className="text-base font-medium text-gray-900">{data.bankConfig.accountHolder}</p>
            </div>

            {/* CLABE */}
            <div>
              <p className="text-xs text-gray-900/60 mb-1">CLABE</p>
              <div className="flex items-center gap-3">
                <p className="text-lg font-mono font-bold text-gray-900 tracking-wider">
                  {data.bankConfig.clabe}
                </p>
                <button
                  onClick={() => copyToClipboard(data.bankConfig.clabe, 'clabe')}
                  className="flex items-center gap-2 text-sm text-[#E85A9A] hover:text-[#EC5C9F] transition-colors px-3 py-1.5 border border-[#E85A9A]/30 hover:border-[#E85A9A] rounded"
                >
                  {copiedClabe ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copiada
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Payment Reference */}
            <div className="pt-4 border-t border-[#E85A9A]/10">
              <p className="text-xs text-gray-900/60 mb-1">
                Referencia de pago <span className="text-[#E85A9A] font-medium">(IMPORTANTE)</span>
              </p>
              <div className="flex items-center gap-3">
                <p className="text-lg font-mono font-bold text-gray-900 tracking-wider">
                  {data.paymentReference}
                </p>
                <button
                  onClick={() => copyToClipboard(data.paymentReference, 'reference')}
                  className="flex items-center gap-2 text-sm text-[#E85A9A] hover:text-[#EC5C9F] transition-colors px-3 py-1.5 border border-[#E85A9A]/30 hover:border-[#E85A9A] rounded"
                >
                  {copiedReference ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copiada
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copiar
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-900/60 mt-2">
                Usa esta referencia para identificar tu pago
              </p>
            </div>

            {/* Expiration */}
            {!isExpired && (
              <div className="pt-4 border-t border-[#E85A9A]/10">
                <p className="text-xs text-gray-900/60 mb-1">Válido hasta</p>
                <p className="text-sm text-gray-900">
                  {expiresDate.toLocaleString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Instructions */}
          {data.bankConfig.paymentInstructions && (
            <div className="mt-6 pt-6 border-t border-[#E85A9A]/10">
              <p className="text-sm text-gray-900/70 whitespace-pre-line">
                {data.bankConfig.paymentInstructions}
              </p>
            </div>
          )}
        </div>

        {/* Upload Proof Section - Only show if status allows upload */}
        {!uploadSuccess && !isExpired && (data.transactionStatus === 'pending' || data.transactionStatus === 'rejected') && (
          <div className="bg-white border-2 border-[#E85A9A]/20 p-6 md:p-8 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {data.transactionStatus === 'rejected' ? 'Subir nuevo comprobante' : 'Subir comprobante de pago'}
            </h2>
            <p className="text-sm text-gray-900/60 mb-6">
              {data.transactionStatus === 'rejected' 
                ? 'El comprobante anterior fue rechazado. Por favor, sube un nuevo comprobante.'
                : 'Una vez realizada tu transferencia, sube tu comprobante para que podamos validar tu pago.'
              }
            </p>

            {uploadError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 text-sm mb-4">
                {uploadError}
              </div>
            )}

            <label className="block mb-4">
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleFileSelect}
                disabled={uploadingProof}
                className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:border file:border-[#E85A9A]/30 file:bg-[#E85A9A]/5 file:text-[#E85A9A] hover:file:bg-[#E85A9A]/10 file:transition-colors file:cursor-pointer cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-900/60 mt-2">
                Formatos aceptados: JPG, PNG, PDF (máximo 5MB)
              </p>
            </label>

            {/* Selected file info */}
            {selectedFile && !uploadingProof && (
              <div className="bg-blue-50 border border-blue-200 px-4 py-3 mb-4 rounded">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmitProof}
              disabled={!selectedFile || uploadingProof}
              className="w-full bg-[#E85A9A] text-white font-medium py-3 px-6 hover:bg-[#E85A9A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#E85A9A] flex items-center justify-center gap-2"
            >
              {uploadingProof ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Enviar comprobante</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/catalogo"
            className="flex-1 text-center border-2 border-[#E85A9A]/30 text-gray-900 px-6 py-3 hover:border-[#E85A9A] transition-colors"
          >
            Volver al Catálogo
          </Link>
          {data.trackingToken && (
            <Link
              href={`/track/${data.trackingToken}`}
              className="flex-1 text-center bg-[#E85A9A] text-white px-6 py-3 hover:bg-[#E85A9A]/90 transition-colors"
            >
              Ver Estado del Pedido
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
