'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'

function SuccessContent() {
  const searchParams = useSearchParams()
  const session_id = searchParams.get('session_id')
  const { clearCart } = useCart()
  const [verifying, setVerifying] = useState(true)
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean
    message?: string
    error?: string
  } | null>(null)

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
            ¡Pago Exitoso!
          </h1>
          <p className="text-gray-900/60 mb-2">
            Tu pedido ha sido confirmado
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

        <div className="bg-[#FF69B4]/5 border border-[#FF69B4]/20 p-8 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">¿Qué sigue?</h2>
          <ul className="text-sm text-gray-900/60 space-y-2 text-left max-w-md mx-auto">
            <li>✓ Recibirás un email de confirmación</li>
            <li>✓ Nos pondremos en contacto contigo para coordinar la entrega</li>
            <li>✓ Tu pedido incluye certificado de autenticidad Entrupy</li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={() => {
              window.location.href = '/catalogo'
            }}
            className="border border-[#FF69B4]/20 text-gray-900 px-8 py-3 hover:border-[#FF69B4] transition-colors cursor-pointer"
          >
            Ver más productos
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/'
            }}
            className="bg-[#FF69B4] text-white px-8 py-3 hover:bg-[#FF69B4]/90 transition-colors cursor-pointer"
          >
            Volver al inicio
          </button>
        </div>
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
