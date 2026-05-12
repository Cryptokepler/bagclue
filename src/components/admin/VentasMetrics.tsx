'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type Metrics = {
  totalVentas: number
  ventasContado: number
  ventasAPagos: number
  pagadas: number
  pendientes: number
  ingresosConfirmados: number
  saldoPendiente: number
  proximosPagos: number
}

type VentasMetricsProps = {
  metrics: Metrics
}

export default function VentasMetrics({ metrics }: VentasMetricsProps) {
  const searchParams = useSearchParams()
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  const isActive = (href: string) => {
    const urlParams = new URLSearchParams(href.split('?')[1] || '')
    const currentType = searchParams.get('type')
    const currentPaymentStatus = searchParams.get('payment_status')
    const currentSort = searchParams.get('sort')
    
    const targetType = urlParams.get('type')
    const targetPaymentStatus = urlParams.get('payment_status')
    const targetSort = urlParams.get('sort')
    
    if (targetType && targetType !== currentType) return false
    if (targetPaymentStatus && targetPaymentStatus !== currentPaymentStatus) return false
    if (targetSort && targetSort !== currentSort) return false
    
    return true
  }
  
  const cards = [
    {
      label: 'Total ventas',
      value: metrics.totalVentas,
      format: 'number',
      color: 'text-white',
      href: '/admin/orders?type=all',
      clickeable: true
    },
    {
      label: 'Ventas contado',
      value: metrics.ventasContado,
      format: 'number',
      color: 'text-blue-400',
      href: '/admin/orders?type=cash',
      clickeable: true
    },
    {
      label: 'Ventas a pagos',
      value: metrics.ventasAPagos,
      format: 'number',
      color: 'text-purple-400',
      href: '/admin/orders?type=layaway',
      clickeable: true
    },
    {
      label: 'Pagadas',
      value: metrics.pagadas,
      format: 'number',
      color: 'text-emerald-400',
      href: '/admin/orders?payment_status=paid',
      clickeable: true
    },
    {
      label: 'Pendientes',
      value: metrics.pendientes,
      format: 'number',
      color: 'text-yellow-400',
      href: '/admin/orders?payment_status=pending',
      clickeable: true
    },
    {
      label: 'Ingresos confirmados',
      value: metrics.ingresosConfirmados,
      format: 'currency',
      color: 'text-emerald-400',
      href: '/admin/orders?payment_status=paid',
      clickeable: true
    },
    {
      label: 'Saldo pendiente total',
      value: metrics.saldoPendiente,
      format: 'currency',
      color: 'text-yellow-400',
      href: '/admin/orders?type=layaway&sort=most_pending',
      clickeable: true
    },
    {
      label: 'Próximos pagos',
      value: metrics.proximosPagos,
      format: 'number',
      color: 'text-orange-400',
      href: '/admin/orders?type=layaway&sort=next_payment',
      clickeable: true
    }
  ]
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => {
        const isCardActive = card.clickeable && isActive(card.href)
        
        if (card.clickeable) {
          return (
            <Link 
              key={idx} 
              href={card.href}
              className={`bg-white/5 border p-6 transition-all hover:bg-white/10 cursor-pointer ${
                isCardActive 
                  ? 'border-[#FF69B4] shadow-lg shadow-[#FF69B4]/20' 
                  : 'border-[#FF69B4]/20 hover:border-[#FF69B4]/40'
              }`}
            >
              <div className={`text-3xl font-bold ${card.color} mb-1`}>
                {card.format === 'currency' 
                  ? formatCurrency(card.value)
                  : card.value
                }
              </div>
              <div className="text-sm text-gray-400">{card.label}</div>
            </Link>
          )
        }
        
        return (
          <div key={idx} className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <div className={`text-3xl font-bold ${card.color} mb-1`}>
              {card.format === 'currency' 
                ? formatCurrency(card.value)
                : card.value
              }
            </div>
            <div className="text-sm text-gray-400">{card.label}</div>
          </div>
        )
      })}
    </div>
  )
}
