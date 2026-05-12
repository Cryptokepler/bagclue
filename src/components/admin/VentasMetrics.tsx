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
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  const cards = [
    {
      label: 'Total ventas',
      value: metrics.totalVentas,
      format: 'number',
      color: 'text-white'
    },
    {
      label: 'Ventas contado',
      value: metrics.ventasContado,
      format: 'number',
      color: 'text-blue-400'
    },
    {
      label: 'Ventas a pagos',
      value: metrics.ventasAPagos,
      format: 'number',
      color: 'text-purple-400'
    },
    {
      label: 'Pagadas',
      value: metrics.pagadas,
      format: 'number',
      color: 'text-emerald-400'
    },
    {
      label: 'Pendientes',
      value: metrics.pendientes,
      format: 'number',
      color: 'text-yellow-400'
    },
    {
      label: 'Ingresos confirmados',
      value: metrics.ingresosConfirmados,
      format: 'currency',
      color: 'text-emerald-400'
    },
    {
      label: 'Saldo pendiente total',
      value: metrics.saldoPendiente,
      format: 'currency',
      color: 'text-yellow-400'
    },
    {
      label: 'Próximos pagos',
      value: metrics.proximosPagos,
      format: 'number',
      color: 'text-orange-400'
    }
  ]
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white/5 border border-[#FF69B4]/20 p-6">
          <div className={`text-3xl font-bold ${card.color} mb-1`}>
            {card.format === 'currency' 
              ? formatCurrency(card.value)
              : card.value
            }
          </div>
          <div className="text-sm text-gray-400">{card.label}</div>
        </div>
      ))}
    </div>
  )
}
