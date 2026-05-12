'use client'

import type { ClientePaymentReview } from '@/types/admin-clientes'

interface Props {
  paymentReviews: ClientePaymentReview[]
}

export default function ClientePaymentReviews({ paymentReviews }: Props) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency || 'MXN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPaymentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      full_purchase: 'Compra completa',
      layaway_deposit: 'Depósito de apartado',
      layaway_installment: 'Pago de apartado'
    }
    return types[type] || type
  }

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      bank_transfer_mxn: 'Transferencia bancaria (MXN)',
      stripe_usd: 'Stripe (USD)'
    }
    return methods[method] || method
  }

  if (paymentReviews.length === 0) {
    return (
      <div className="bg-white/5 border border-emerald-500/20 p-6 mb-8">
        <div className="flex items-center gap-2 text-emerald-400">
          <span className="text-xl">✅</span>
          <span className="text-lg font-medium">Sin pagos pendientes de revisión</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-[#FF69B4]/20 mb-8">
      <div className="px-6 py-4 border-b border-[#FF69B4]/10 bg-[#FF69B4]/10">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <h2 className="text-lg text-[#FF69B4] font-medium">
            Pagos pendientes de revisión ({paymentReviews.length})
          </h2>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {paymentReviews.map((review) => (
          <div
            key={review.id}
            className="bg-white/5 border border-[#FF69B4]/20 p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">ID de pago</div>
                <div className="text-white font-mono text-xs">{review.id.slice(0, 12)}...</div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-1">Tipo</div>
                <div className="text-white">{getPaymentTypeLabel(review.payment_type)}</div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-1">Monto</div>
                <div className="text-white font-medium">
                  {formatCurrency(review.amount, review.currency)}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-1">Método</div>
                <div className="text-white">{getPaymentMethodLabel(review.payment_method)}</div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-1">Comprobante subido</div>
                <div className="text-white">{formatDate(review.proof_uploaded_at)}</div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-1">Relacionado con</div>
                <div className="text-white">
                  {review.order_id && (
                    <a
                      href={`/admin/orders/${review.order_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF69B4] hover:text-[#FF69B4]/80 transition-colors"
                    >
                      Pedido {review.order_id.slice(0, 8)}...
                    </a>
                  )}
                  {review.layaway_id && (
                    <span className="text-blue-400">
                      Apartado {review.layaway_id.slice(0, 8)}...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {review.proof_url && (
              <div className="mt-4 pt-4 border-t border-[#FF69B4]/10">
                <a
                  href={review.proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF69B4]/20 border border-[#FF69B4]/30 text-[#FF69B4] hover:bg-[#FF69B4]/30 transition-colors"
                >
                  Ver comprobante
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
