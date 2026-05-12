import Link from 'next/link'

type Layaway = {
  id: string
  customer_name: string
  customer_email: string
  user_id?: string | null
  product_title: string
  product_brand?: string
  total_amount: number
  amount_paid: number
  amount_remaining: number
  payments_completed: number
  payments_remaining: number
  next_payment_due_date?: string
  next_payment_amount?: number
  status: string
  created_at: string
}

type VentasTableLayawayProps = {
  layaways: Layaway[]
  showHeader?: boolean
}

export default function VentasTableLayaway({ layaways, showHeader = true }: VentasTableLayawayProps) {
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
  
  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending_first_payment: 'Pendiente 1er pago',
      active: 'Activo',
      completed: 'Completado',
      overdue: 'Vencido',
      expired: 'Expirado',
      cancelled: 'Cancelado',
      forfeited: 'Perdido',
      cancelled_for_non_payment: 'Cancelado',
      cancelled_manual: 'Cancelado'
    }
    return map[status] || status
  }
  
  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'bg-emerald-500/20 text-emerald-400'
    if (status === 'active') return 'bg-blue-500/20 text-blue-400'
    if (status === 'pending_first_payment') return 'bg-yellow-500/20 text-yellow-400'
    if (status === 'overdue') return 'bg-orange-500/20 text-orange-400'
    if (['cancelled', 'forfeited', 'cancelled_for_non_payment', 'cancelled_manual', 'expired'].includes(status)) {
      return 'bg-red-500/20 text-red-400'
    }
    return 'bg-gray-500/20 text-gray-400'
  }
  
  const getClienteId = (layaway: Layaway) => {
    // Si tiene user_id, usar UUID
    if (layaway.user_id) {
      return layaway.user_id
    }
    // Si no, usar email encoded
    return encodeURIComponent(layaway.customer_email)
  }
  
  return (
    <div className="bg-white/5 border border-[#FF69B4]/20 mb-6">
      {showHeader && (
        <div className="px-6 py-4 border-b border-[#FF69B4]/10">
          <h2 className="text-lg text-white font-medium">Ventas A Pagos / Apartados</h2>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Producto</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Pagado</th>
              <th className="px-6 py-3">Pendiente</th>
              <th className="px-6 py-3">Pagos realizados</th>
              <th className="px-6 py-3">Pagos faltantes</th>
              <th className="px-6 py-3">Próximo pago</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#FF69B4]/10">
            {layaways.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-8 text-center text-gray-400">
                  No hay ventas a pagos
                </td>
              </tr>
            ) : (
              layaways.map((layaway) => (
                <tr key={layaway.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-white text-sm">{layaway.customer_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-400 text-xs">{layaway.customer_email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-300 text-sm max-w-[200px] truncate">
                      {layaway.product_brand && `${layaway.product_brand} `}
                      {layaway.product_title}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {formatCurrency(layaway.total_amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-emerald-400">
                    {formatCurrency(layaway.amount_paid)}
                  </td>
                  <td className="px-6 py-4 text-sm text-yellow-400">
                    {formatCurrency(layaway.amount_remaining)}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {layaway.payments_completed || 0}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {layaway.payments_remaining || 0}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {layaway.next_payment_due_date ? (
                      <div>
                        <div>{formatDate(layaway.next_payment_due_date)}</div>
                        {layaway.next_payment_amount && (
                          <div className="text-[#FF69B4]">
                            {formatCurrency(layaway.next_payment_amount)}
                          </div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 text-xs rounded ${getStatusColor(layaway.status)}`}>
                      {getStatusLabel(layaway.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/admin/layaways/${layaway.id}`}
                        className="text-[#FF69B4] hover:text-[#FF69B4]/80 text-sm transition-colors"
                      >
                        Ver apartado →
                      </Link>
                      <Link
                        href={`/admin/clientes/${getClienteId(layaway)}`}
                        className="text-gray-400 hover:text-gray-300 text-xs transition-colors"
                      >
                        Ver cliente
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
