import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/data/products'
import PayBalanceButton from '@/components/PayBalanceButton'

export const dynamic = 'force-dynamic'

async function getLayawayByToken(token: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bagclue.vercel.app'
    const response = await fetch(`${baseUrl}/api/layaways/track/${token}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) return null
    
    return await response.json()
  } catch (error) {
    console.error('[LAYAWAY PAGE] Error:', error)
    return null
  }
}

function getStatusMessage(status: string, days_remaining: number): { emoji: string, title: string, message: string } {
  if (status === 'cancelled') {
    return {
      emoji: '❌',
      title: 'Apartado cancelado',
      message: 'Este apartado fue cancelado. Contacta a soporte si tienes dudas.'
    }
  }

  if (status === 'expired') {
    return {
      emoji: '⏰',
      title: 'Apartado vencido',
      message: 'El plazo de pago venció. Contacta a soporte para opciones.'
    }
  }

  if (status === 'completed') {
    return {
      emoji: '✅',
      title: '¡Apartado completado!',
      message: 'Completaste el pago. Tu pedido será procesado pronto.'
    }
  }

  if (status === 'active') {
    if (days_remaining <= 0) {
      return {
        emoji: '⚠️',
        title: 'Plazo vencido',
        message: 'Tu plazo de pago venció. Contacta a soporte.'
      }
    }
    if (days_remaining <= 3) {
      return {
        emoji: '⏰',
        title: `Quedan ${days_remaining} días`,
        message: `Tu plazo está por vencer. Completa el pago pronto.`
      }
    }
    return {
      emoji: '📦',
      title: 'Apartado activo',
      message: `Tu pieza está apartada. Tienes ${days_remaining} días para completar el pago.`
    }
  }

  return {
    emoji: '🔄',
    title: 'Procesando...',
    message: 'Tu apartado está siendo procesado.'
  }
}

export default async function LayawayTrackingPage({ 
  params 
}: { 
  params: Promise<{ layaway_token: string }> 
}) {
  const { layaway_token } = await params
  
  const data = await getLayawayByToken(layaway_token)
  
  if (!data || !data.layaway) {
    notFound()
  }

  const { layaway } = data
  const statusInfo = getStatusMessage(layaway.status, layaway.days_remaining)

  const canPayBalance = layaway.status === 'active' && layaway.days_remaining > 0

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-24">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl text-gray-900 mb-2">
            Seguimiento de Apartado
          </h1>
          <p className="text-sm text-gray-600">
            Apartado desde {formatDate(layaway.created_at)}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white border border-[#FF69B4]/10 p-6 mb-6 text-center">
          <p className="text-4xl mb-3">{statusInfo.emoji}</p>
          <h2 className="text-xl font-medium text-gray-900 mb-2">{statusInfo.title}</h2>
          <p className="text-sm text-gray-600">{statusInfo.message}</p>
        </div>

        {/* Product */}
        <div className="bg-white border border-[#FF69B4]/10 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Producto Apartado</h2>
          
          <div className="flex gap-4">
            {layaway.product.image && (
              <div className="w-24 h-24 bg-gray-100 flex-shrink-0 overflow-hidden">
                <img 
                  src={layaway.product.image} 
                  alt={layaway.product.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {layaway.product.brand} {layaway.product.title}
              </p>
              {layaway.product.model && (
                <p className="text-xs text-gray-600 mt-1">
                  Modelo: {layaway.product.model}
                </p>
              )}
              {layaway.product.color && (
                <p className="text-xs text-gray-600">
                  Color: {layaway.product.color}
                </p>
              )}
              <p className="text-sm text-[#FF69B4] mt-2">
                ${layaway.product_price.toLocaleString()} {layaway.currency}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white border border-[#FF69B4]/10 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Detalles de Pago</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Depósito inicial ({layaway.deposit_percent}%)</span>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">
                  ${layaway.deposit_amount.toLocaleString()} {layaway.currency}
                </span>
                {layaway.deposit_paid_at && (
                  <p className="text-xs text-emerald-600">✓ Pagado {formatDate(layaway.deposit_paid_at)}</p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Saldo restante</span>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">
                  ${layaway.balance_amount.toLocaleString()} {layaway.currency}
                </span>
                {layaway.balance_paid_at ? (
                  <p className="text-xs text-emerald-600">✓ Pagado {formatDate(layaway.balance_paid_at)}</p>
                ) : (
                  <p className="text-xs text-amber-600">Pendiente</p>
                )}
              </div>
            </div>

            {layaway.status === 'active' && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Fecha límite</span>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{formatDate(layaway.expires_at)}</span>
                  <p className="text-xs text-gray-600">
                    {layaway.days_remaining > 0 ? `${layaway.days_remaining} días restantes` : 'Vencido'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pay Balance Button */}
        {canPayBalance && (
          <PayBalanceButton 
            layawayId={layaway.id}
            balanceAmount={layaway.balance_amount}
            currency={layaway.currency}
          />
        )}

        {/* Cancelled Info */}
        {layaway.status === 'cancelled' && layaway.cancellation_reason && (
          <div className="bg-red-50 border border-red-200 p-4 mb-6">
            <p className="text-sm text-red-800">
              <strong>Motivo de cancelación:</strong> {layaway.cancellation_reason}
            </p>
          </div>
        )}

        {/* Support */}
        <div className="bg-[#FF69B4]/5 border border-[#FF69B4]/20 p-6 mb-6">
          <p className="text-sm text-gray-900 mb-3">¿Dudas sobre tu apartado?</p>
          <div className="space-y-2 text-sm">
            <p className="text-gray-700">
              📷 Instagram: <a href="https://instagram.com/salebybagcluemx" target="_blank" className="text-[#FF69B4] hover:underline">@salebybagcluemx</a>
            </p>
            <p className="text-gray-700">
              💬 WhatsApp: <a href="https://wa.me/525512345678" target="_blank" className="text-[#FF69B4] hover:underline">+52 55 1234 5678</a>
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex gap-4 justify-center">
          <Link 
            href="/catalogo"
            className="border border-[#FF69B4]/20 text-gray-900 px-8 py-3 hover:border-[#FF69B4] transition-colors"
          >
            Ver catálogo
          </Link>
          <Link 
            href="/"
            className="bg-[#FF69B4] text-white px-8 py-3 hover:bg-[#FF69B4]/90 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}
