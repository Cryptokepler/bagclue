'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminNav from '@/components/admin/AdminNav'

interface Payment {
  transactionId: string
  orderId: string
  customerName: string
  customerEmail: string
  product: string
  amount: number
  paymentReference: string
  proofUploadedAt: string
  proofFileName: string
  proofUrl: string | null
  status: string
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ show: boolean; transactionId: string | null }>({
    show: false,
    transactionId: null,
  })
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    loadPayments()
  }, [router])

  async function loadPayments() {
    try {
      const res = await fetch('/api/payments/admin/list')
      if (res.status === 401) {
        // Not authenticated, redirect to login
        router.push('/admin/login')
        return
      }
      if (!res.ok) {
        throw new Error('Error al cargar pagos')
      }
      const data = await res.json()
      setPayments(data.payments || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(transactionId: string, amount: number) {
    if (!confirm(`¿Confirmar pago de $${amount.toLocaleString()} MXN? El producto se marcará como vendido.`)) {
      return
    }

    setProcessing(transactionId)
    setError('')

    try {
      const res = await fetch('/api/payments/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          action: 'approve',
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al aprobar pago')
      }

      // Remove from list
      setPayments(prev => prev.filter(p => p.transactionId !== transactionId))
      alert('Pago aprobado correctamente')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(null)
    }
  }

  async function handleReject() {
    if (!rejectModal.transactionId) return
    if (!rejectionReason.trim()) {
      alert('Debes proporcionar un motivo de rechazo')
      return
    }

    setProcessing(rejectModal.transactionId)
    setError('')

    try {
      const res = await fetch('/api/payments/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: rejectModal.transactionId,
          action: 'reject',
          rejectionReason: rejectionReason.trim(),
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al rechazar pago')
      }

      // Remove from list
      setPayments(prev => prev.filter(p => p.transactionId !== rejectModal.transactionId))
      alert('Pago rechazado correctamente')
      setRejectModal({ show: false, transactionId: null })
      setRejectionReason('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(null)
    }
  }

  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'hace menos de 1 hora'
    if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
    if (diffDays < 7) return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
    return date.toLocaleDateString('es-MX')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <AdminNav />
        <div className="flex items-center justify-center py-24">
          <p className="text-gray-300">Cargando pagos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl text-white mb-2">
            Pagos por Transferencia
          </h1>
          <p className="text-gray-400">
            Revisa y aprueba comprobantes de pago bancario
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-600 text-red-300 px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {payments.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-300 text-lg mb-2">
              No hay pagos pendientes de revisión
            </p>
            <p className="text-gray-500 text-sm">
              Los comprobantes aparecerán aquí cuando los clientes los suban
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.transactionId}
                className="bg-gray-800 border border-gray-700 rounded-lg p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Info */}
                  <div className="md:col-span-7">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Cliente</p>
                        <p className="font-medium text-white">{payment.customerName}</p>
                        <p className="text-sm text-gray-400">{payment.customerEmail}</p>
                      </div>
                      <span className="text-2xl font-bold text-[#FF69B4]">
                        ${payment.amount.toLocaleString()} MXN
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-gray-400">Producto</p>
                        <p className="text-gray-200">{payment.product}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Referencia</p>
                        <p className="font-mono text-gray-200">{payment.paymentReference}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Subido</p>
                        <p className="text-gray-200">{formatRelativeTime(payment.proofUploadedAt)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Archivo</p>
                        <p className="text-gray-200 truncate">{payment.proofFileName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Order: ****{payment.orderId.slice(-8)}</span>
                      <span>•</span>
                      <span>TX: ****{payment.transactionId.slice(-8)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-5 flex flex-col gap-2">
                    {payment.proofUrl ? (
                      <a
                        href={payment.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 border border-blue-500 text-blue-400 px-4 py-2 hover:bg-blue-900/30 transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver comprobante
                      </a>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center justify-center gap-2 border border-gray-600 text-gray-500 px-4 py-2 cursor-not-allowed text-sm font-medium opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Sin comprobante
                      </button>
                    )}

                    <button
                      onClick={() => handleApprove(payment.transactionId, payment.amount)}
                      disabled={!!processing || !payment.proofUrl}
                      className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!payment.proofUrl ? "No se puede aprobar sin comprobante" : ""}
                    >
                      {processing === payment.transactionId ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Aprobar pago
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setRejectModal({ show: true, transactionId: payment.transactionId })}
                      disabled={!!processing}
                      className="inline-flex items-center justify-center gap-2 border border-red-300 text-red-700 px-4 py-2 hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Rechazar pago
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal.show && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 max-w-md w-full p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-4">
                Rechazar comprobante
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Proporciona un motivo para que el cliente pueda corregir el comprobante
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ej: Comprobante ilegible, monto incorrecto, referencia no coincide..."
                className="w-full bg-gray-900 border border-gray-600 text-white rounded px-3 py-2 text-sm mb-4 min-h-[100px] placeholder:text-gray-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setRejectModal({ show: false, transactionId: null })
                    setRejectionReason('')
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  disabled={!!processing || !rejectionReason.trim()}
                  className="flex-1 bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Procesando...' : 'Confirmar rechazo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
