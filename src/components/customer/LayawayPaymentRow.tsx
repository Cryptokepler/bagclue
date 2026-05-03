'use client'

import { LayawayPayment, formatPaymentStatus } from '@/types/layaway'

interface LayawayPaymentRowProps {
  payment: LayawayPayment
  isNext: boolean
}

// Helper para formatear fecha sin timezone shift
const formatDateSafe = (dateString: string | null): string => {
  if (!dateString) return '—'
  // Extraer solo YYYY-MM-DD sin conversión de timezone
  const dateOnly = dateString.split('T')[0]
  const [year, month, day] = dateOnly.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function LayawayPaymentRow({ payment, isNext }: LayawayPaymentRowProps) {
  const statusInfo = formatPaymentStatus(payment.status)
  
  const isPaid = payment.status === 'paid'
  const isPending = payment.status === 'pending'
  const isOverdue = payment.status === 'overdue'
  
  return (
    <tr className={`${
      isNext ? 'bg-blue-50' : isPaid ? 'bg-green-50' : ''
    } border-b border-gray-200 hover:bg-gray-50 transition-colors`}>
      {/* Número */}
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        #{payment.payment_number}
      </td>
      
      {/* Monto */}
      <td className="px-4 py-3 text-sm text-gray-900">
        ${payment.amount_due.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
      </td>
      
      {/* Fecha vencimiento */}
      <td className="px-4 py-3 text-sm text-gray-700">
        {formatDateSafe(payment.due_date)}
      </td>
      
      {/* Estado */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          isPaid ? 'bg-green-100 text-green-800' :
          isOverdue ? 'bg-red-100 text-red-800' :
          isPending && isNext ? 'bg-blue-100 text-blue-800' :
          isPending ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {isNext && isPending ? '📅 Próximo' : `${statusInfo.icon} ${statusInfo.label}`}
        </span>
      </td>
      
      {/* Fecha de pago (si ya se pagó) */}
      <td className="px-4 py-3 text-sm text-gray-600">
        {payment.paid_at ? formatDateSafe(payment.paid_at) : <span className="text-gray-400">—</span>}
      </td>
    </tr>
  )
}
