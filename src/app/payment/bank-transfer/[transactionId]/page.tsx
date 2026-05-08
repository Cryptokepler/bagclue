'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  bankConfig: BankConfig
}

export default function BankTransferPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const transactionId = params?.transactionId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<TransactionData | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [copiedClabe, setCopiedClabe] = useState(false)
  const [copiedReference, setCopiedReference] = useState(false)

  useEffect(() => {
    if (!transactionId) return

    async function fetchTransactionData() {
      try {
        // Get session token if available
        const { data: { session } } = await supabaseCustomer.auth.getSession()
        const headers: HeadersInit = {}
        
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }

        // Fetch bank config for this transaction
        // Note: Backend validates ownership via customer_email or user_id
        const res = await fetch(`/api/payments/bank-transfer/config?transaction_id=${transactionId}`, {
          headers
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Error al cargar datos de pago')
        }

        const configData = await res.json()
        
        // Fetch transaction details from payment_transactions
        const { data: transaction } = await supabaseCustomer
          .from('payment_transactions')
          .select('id, order_id, payment_reference, amount, expires_at')
          .eq('id', transactionId)
          .single()

        if (!transaction) {
          throw new Error('Transacción no encontrada')
        }

        setData({
          transactionId: transaction.id,
          orderId: transaction.order_id,
          paymentReference: transaction.payment_reference,
          amountMxn: transaction.amount,
          expiresAt: transaction.expires_at,
          bankConfig: configData.bankConfig
        })
      } catch (err: any) {
        console.error('[BankTransfer] Error loading data:', err)
        setError(err.message || 'Error al cargar datos de pago')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactionData()
  }, [transactionId])

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

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      setUploadError('Solo se permiten archivos JPG, PNG o PDF')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('El archivo debe ser menor a 5MB')
      return
    }

    setUploadingProof(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('transactionId', transactionId)

      const res = await fetch('/api/payments/bank-transfer/upload-proof', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al subir comprobante')
      }

      setUploadSuccess(true)
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

        {/* Success Upload Banner */}
        {uploadSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 p-6 mb-8">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-emerald-800 mb-1">
                  Comprobante recibido
                </h3>
                <p className="text-sm text-emerald-700">
                  Nuestro equipo validará tu pago. Te notificaremos por email cuando tu compra sea confirmada.
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

        {/* Upload Proof Section */}
        {!uploadSuccess && !isExpired && (
          <div className="bg-white border-2 border-[#E85A9A]/20 p-6 md:p-8 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Subir comprobante de pago
            </h2>
            <p className="text-sm text-gray-900/60 mb-6">
              Una vez realizada tu transferencia, sube tu comprobante para que podamos validar tu pago.
            </p>

            {uploadError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 text-sm mb-4">
                {uploadError}
              </div>
            )}

            <label className="block">
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleProofUpload}
                disabled={uploadingProof}
                className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:border file:border-[#E85A9A]/30 file:bg-[#E85A9A]/5 file:text-[#E85A9A] hover:file:bg-[#E85A9A]/10 file:transition-colors file:cursor-pointer cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-900/60 mt-2">
                Formatos aceptados: JPG, PNG, PDF (máximo 5MB)
              </p>
            </label>

            {uploadingProof && (
              <div className="mt-4 flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#E85A9A]"></div>
                <span className="text-sm text-gray-900/60">Subiendo comprobante...</span>
              </div>
            )}
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
          <Link
            href={`/track/${data.orderId}`}
            className="flex-1 text-center bg-[#E85A9A] text-white px-6 py-3 hover:bg-[#E85A9A]/90 transition-colors"
          >
            Ver Estado del Pedido
          </Link>
        </div>
      </div>
    </div>
  )
}
