'use client'

import Link from 'next/link'
import { Layaway, formatPlanType, formatLayawayStatus } from '@/types/layaway'

interface LayawayCardProps {
  layaway: Layaway
}

export default function LayawayCard({ layaway }: LayawayCardProps) {
  const statusInfo = formatLayawayStatus(layaway.status)
  const planLabel = formatPlanType(layaway.plan_type)
  
  const paymentsCompleted = layaway.payments_completed || 0
  const totalPayments = layaway.total_payments || 0
  const progress = totalPayments > 0 ? (paymentsCompleted / totalPayments) * 100 : 0
  
  const totalAmount = layaway.total_amount || 0
  const amountPaid = layaway.amount_paid || 0
  const amountRemaining = layaway.amount_remaining || 0
  
  // Helper para formatear fecha sin timezone shift
  const formatDateSafe = (dateString: string | null): string => {
    if (!dateString) return '—'
    // Extraer solo YYYY-MM-DD sin conversión de timezone
    const dateOnly = dateString.split('T')[0]
    const [year, month, day] = dateOnly.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-6">
        {/* Header con foto y título */}
        <div className="flex gap-4 mb-4">
          {/* Fallback siempre - sin Image de Next.js para evitar GET 400 */}
          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
              {layaway.product?.title || 'Producto'}
            </h3>
            
            <p className="text-sm text-gray-600 mb-2">
              {planLabel}
            </p>
            
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                statusInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {statusInfo.icon} {statusInfo.label}
              </span>
            </div>
          </div>
        </div>
        
        {/* Montos */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold text-gray-900">
              ${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Pagado:</span>
            <span className="font-semibold text-green-600">
              ${amountPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Saldo:</span>
            <span className="font-semibold text-gray-900">
              ${amountRemaining.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        {/* Barra de progreso */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progreso</span>
            <span>{paymentsCompleted}/{totalPayments} pagos</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-pink-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Próximo pago */}
        {layaway.next_payment_due_date && layaway.next_payment_amount && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-600 mb-1">Próximo pago:</p>
            <p className="text-sm font-semibold text-gray-900">
              ${layaway.next_payment_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Vence: {formatDateSafe(layaway.next_payment_due_date)}
            </p>
          </div>
        )}
        
        {/* Botón ver detalle */}
        <Link
          href={`/account/layaways/${layaway.id}`}
          className="block w-full text-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          Ver detalle →
        </Link>
      </div>
    </div>
  )
}
