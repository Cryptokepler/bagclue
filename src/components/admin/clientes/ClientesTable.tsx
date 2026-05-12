'use client'

import Link from 'next/link'
import ClienteArchivedBadge from './ClienteArchivedBadge'
import type { Cliente } from '@/types/admin-clientes'

interface Props {
  clientes: Cliente[]
}

export default function ClientesTable({ clientes }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusBadge = (cliente: Cliente) => {
    const badges = []
    
    if (cliente.has_payment_review) {
      badges.push(
        <span key="review" className="px-2 py-1 text-xs bg-[#FF69B4]/20 text-[#FF69B4] border border-[#FF69B4]/30">
          🔴 Pago en revisión
        </span>
      )
    }
    
    if (cliente.has_pending_address) {
      badges.push(
        <span key="address" className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
          🟡 Pendiente dirección
        </span>
      )
    }
    
    if (cliente.has_active_layaway) {
      badges.push(
        <span key="layaway" className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
          🟢 Apartado activo
        </span>
      )
    }
    
    if (cliente.customer_status === 'recurring') {
      badges.push(
        <span key="recurring" className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          🔵 Recurrente
        </span>
      )
    }

    return badges.length > 0 ? <div className="flex flex-wrap gap-1">{badges}</div> : '-'
  }

  const getTypeBadge = (type: string) => {
    if (type === 'registered') {
      return <span className="text-xs text-emerald-400">Registrado</span>
    } else if (type === 'guest') {
      return <span className="text-xs text-gray-400">Guest</span>
    } else {
      return <span className="text-xs text-blue-400">Híbrido</span>
    }
  }

  return (
    <div className="bg-white/5 border border-[#FF69B4]/20">
      <div className="px-6 py-4 border-b border-[#FF69B4]/10">
        <h2 className="text-lg text-white font-medium">Clientes</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
              <th className="px-6 py-3">Nombre</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Teléfono</th>
              <th className="px-6 py-3">Tipo</th>
              <th className="px-6 py-3">Total comprado</th>
              <th className="px-6 py-3"># Pedidos</th>
              <th className="px-6 py-3">Pagos pend.</th>
              <th className="px-6 py-3">Pagos rev.</th>
              <th className="px-6 py-3">Saldo pend.</th>
              <th className="px-6 py-3">Última compra</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#FF69B4]/10">
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-6 py-8 text-center text-gray-400">
                  No se encontraron clientes
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-white">
                    <div className="flex items-center gap-2">
                      <span>{cliente.name || '-'}</span>
                      <ClienteArchivedBadge archivedAt={cliente.archived_at} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {cliente.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {cliente.phone || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getTypeBadge(cliente.type)}
                  </td>
                  <td className="px-6 py-4 text-sm text-emerald-400 font-medium">
                    {formatCurrency(cliente.total_spent)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {cliente.total_orders}
                  </td>
                  <td className="px-6 py-4 text-sm text-yellow-400">
                    {cliente.pending_payments}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#FF69B4]">
                    {cliente.has_payment_review ? '✓' : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-yellow-400">
                    {cliente.balance_due > 0 ? formatCurrency(cliente.balance_due) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {formatDate(cliente.last_purchase_at)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getStatusBadge(cliente)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/admin/clientes/${encodeURIComponent(cliente.id)}`}
                      className="text-[#FF69B4] hover:text-[#FF69B4]/80 transition-colors"
                    >
                      Ver cliente
                    </Link>
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
