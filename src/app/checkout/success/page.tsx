'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { supabaseCustomer } from '@/lib/supabase-customer'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const session_id = searchParams.get('session_id')
  const { clearCart } = useCart()
  const [verifying, setVerifying] = useState(true)
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean
    message?: string
    error?: string
    order_id?: string
    order?: {
      id: string
      customer_name: string
      total: number
      currency: string | null
      shipping_address: string | null
      order_items: Array<{
        product_snapshot: {
          brand: string
          title: string
        }
      }>
    } | null
  } | null>(null)
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Check if user is logged in
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabaseCustomer.auth.getUser()
      setIsLoggedIn(!!user)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    // Verificar sesión de pago UNA SOLA VEZ
    const verifySession = async () => {
      if (!session_id) {
        setVerifying(false)
        return
      }

      try {
        console.log('[SUCCESS] Verificando sesión:', session_id)
        const response = await fetch(`/api/checkout/verify-session?session_id=${session_id}`, {
          signal: AbortSignal.timeout(10000) // 10s timeout
        })
        const data = await response.json()
        
        console.log('[SUCCESS] Resultado verificación:', data)
        setVerifyResult(data)
      } catch (error: any) {
        console.error('[SUCCESS] Error verificando sesión:', error)
        setVerifyResult({
          success: false,
          error: error.name === 'TimeoutError' 
            ? 'Verificación en proceso (puede tardar unos segundos)'
            : 'Error al verificar el pago'
        })
      } finally {
        setVerifying(false)
      }
    }

    verifySession()
    
    // Limpiar carrito después de compra exitosa
    clearCart()
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session_id]) // ✅ SOLO session_id - evita loop

  // Obtener tracking URL después de verificar pago
  useEffect(() => {
    const fetchTrackingUrl = async () => {
      if (verifyResult?.success && verifyResult.order_id) {
        try {
          const response = await fetch(`/api/orders/${verifyResult.order_id}/tracking-url`)
          const data = await response.json()
          setTrackingUrl(data.tracking_url)
        } catch (error) {
          console.error('[SUCCESS] Error fetching tracking URL:', error)
        }
      }
    }

    fetchTrackingUrl()
  }, [verifyResult])

  const handleCopyLink = () => {
    if (trackingUrl) {
      navigator.clipboard.writeText(trackingUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  return (
    <div className="pt-28 pb-24">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full mx-auto flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl text-gray-900 mb-4">
            ¡Gracias por tu compra!
          </h1>
          <p className="text-gray-900/60 mb-2">
            Tu pieza Bagclue ha sido reservada y tu pago fue confirmado correctamente.
          </p>
          {session_id && (
            <p className="text-xs text-gray-900/40 mb-4">
              ID de sesión: {session_id}
            </p>
          )}
          
          {/* Estado de verificación */}
          {verifying && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 text-sm">
              🔄 Verificando pago...
            </div>
          )}
          {!verifying && verifyResult && (
            <div className={`mt-4 p-3 border text-sm ${
              verifyResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              {verifyResult.success 
                ? '✅ Pago verificado y orden actualizada'
                : `⚠️ ${verifyResult.message || verifyResult.error || 'Verificación pendiente'}`
              }
            </div>
          )}
        </div>

        {/* Detalles del pedido */}
        {verifyResult?.success && verifyResult.order && (
          <div className="bg-white border border-[#FF69B4]/20 p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">📦 Detalles de tu pedido</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Número de pedido:</span>
                <span className="font-mono font-medium text-gray-900">
                  #{verifyResult.order.id.slice(-8).toUpperCase()}
                </span>
              </div>
              
              {verifyResult.order.order_items?.[0] && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Producto:</span>
                  <span className="font-medium text-gray-900 text-right">
                    {verifyResult.order.order_items[0].product_snapshot.brand} {verifyResult.order.order_items[0].product_snapshot.title}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Total pagado:</span>
                <span className="font-medium text-gray-900">
                  ${verifyResult.order.total.toLocaleString('es-MX')} {verifyResult.order.currency || 'MXN'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="font-medium text-emerald-600">
                  ✅ Pagado
                </span>
              </div>
              
              {!verifyResult.order.shipping_address && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-[#FF69B4]/5 -mx-6 -mb-6 mt-4 p-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">📍 Siguiente paso: confirma tu dirección de envío</p>
                    <p className="text-xs text-gray-600">
                      Para preparar el envío, necesitamos que nos indiques a dónde quieres recibir tu compra.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-[#FF69B4]/5 border border-[#FF69B4]/20 p-8 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">¿Qué sigue?</h2>
          <ol className="text-sm text-gray-900/60 space-y-3 text-left max-w-md mx-auto">
            <li className="flex gap-3">
              <span className="font-semibold text-[#FF69B4] flex-shrink-0">1.</span>
              <span>Confirma tu dirección de envío.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-[#FF69B4] flex-shrink-0">2.</span>
              <span>Nuestro equipo preparará y verificará tu pieza.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-[#FF69B4] flex-shrink-0">3.</span>
              <span>Cuando tu paquete sea enviado, podrás rastrearlo desde tu cuenta.</span>
            </li>
          </ol>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Después de confirmar tu dirección, nuestro equipo preparará tu envío.
          </p>
        </div>

        {/* Navigation buttons */}
        {isLoggedIn ? (
          <div className="space-y-4">
            {verifyResult?.success && verifyResult.order_id ? (
              /* Usuario logueado CON orden verificada */
              <div className="space-y-4">
                {/* Primary CTA */}
                <div className="flex justify-center">
                  {!verifyResult.order?.shipping_address ? (
                    <Link
                      href={`/account/orders/${verifyResult.order_id}?action=confirm-shipping`}
                      className="bg-[#FF69B4] text-white px-8 py-4 hover:bg-[#FF69B4]/90 transition-colors inline-block font-medium text-center"
                    >
                      📍 Indica tu dirección de envío
                    </Link>
                  ) : (
                    <Link
                      href={`/account/orders/${verifyResult.order_id}`}
                      className="bg-[#FF69B4] text-white px-8 py-4 hover:bg-[#FF69B4]/90 transition-colors inline-block font-medium text-center"
                    >
                      Ver detalle del pedido
                    </Link>
                  )}
                </div>
                {/* Secondary CTA - solo si NO tiene dirección */}
                {!verifyResult.order?.shipping_address && (
                  <div className="flex justify-center">
                    <Link
                      href={`/account/orders/${verifyResult.order_id}`}
                      className="text-sm text-gray-600 hover:text-[#FF69B4] transition-colors underline"
                    >
                      Ver detalle del pedido
                    </Link>
                  </div>
                )}
                {/* Secondary CTA - Todos mis pedidos (solo si SÍ tiene dirección) */}
                {verifyResult.order?.shipping_address && (
                  <div className="flex justify-center">
                    <Link
                      href="/account/orders"
                      className="text-sm text-gray-600 hover:text-[#FF69B4] transition-colors underline"
                    >
                      Todos mis pedidos
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              /* Usuario logueado SIN orden verificada (fallback) */
              <div className="flex justify-center">
                <Link
                  href="/account/orders"
                  className="bg-[#FF69B4] text-white px-8 py-4 hover:bg-[#FF69B4]/90 transition-colors inline-block font-medium"
                >
                  Ver mis pedidos
                </Link>
              </div>
            )}
            
            {/* Seguir comprando - siempre visible */}
            <div className="flex gap-4 justify-center">
              <Link
                href="/catalogo"
                className="text-sm text-gray-600 hover:text-[#FF69B4] transition-colors"
              >
                Seguir comprando →
              </Link>
            </div>
            
            {/* Tracking Link - secundario pequeño */}
            {trackingUrl && (
              <div className="pt-4 border-t border-gray-200 mt-6">
                <p className="text-xs text-gray-500 mb-3 text-center">
                  También puedes guardar tu link de seguimiento:
                </p>
                <div className="max-w-md mx-auto">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={trackingUrl}
                      readOnly
                      className="flex-1 text-xs bg-gray-50 border border-gray-300 px-3 py-2 rounded text-gray-600"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 text-xs border border-[#FF69B4]/20 hover:border-[#FF69B4] transition-colors"
                    >
                      {copySuccess ? '✓ Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Guest user - suggest login */}
            <div className="bg-[#FF69B4]/10 border border-[#FF69B4]/30 p-6 mb-4">
              <p className="text-sm font-medium text-gray-900 mb-2">
                📍 Siguiente paso: confirma tu dirección de envío
              </p>
              <p className="text-sm text-gray-600">
                Para completar tu pedido, inicia sesión con el email que usaste en el checkout y confirma a dónde quieres recibir tu compra.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/account/login"
                className="bg-[#FF69B4] text-white px-8 py-4 hover:bg-[#FF69B4]/90 transition-colors inline-block font-medium text-center"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/catalogo"
                className="border border-[#FF69B4]/20 text-gray-900 px-8 py-3 hover:border-[#FF69B4] transition-colors inline-block text-center"
              >
                Ver más productos
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="pt-28 pb-24 text-center">Cargando...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
