'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const session_id = searchParams.get('session_id')
  const [layawayToken, setLayawayToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // En un futuro, podríamos obtener el token del apartado desde la sesión de Stripe
    // Por ahora, solo mostramos mensaje de éxito
    setLoading(false)
  }, [session_id])

  if (loading) {
    return (
      <div className="pt-28 pb-24">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-gray-900/40">Verificando apartado...</p>
        </div>
      </div>
    )
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
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-gray-900 mb-4">
            ¡Apartado Confirmado!
          </h1>
          <p className="text-gray-900/60 mb-2">
            Tu depósito fue recibido exitosamente
          </p>
        </div>

        <div className="bg-[#FF69B4]/5 border border-[#FF69B4]/20 p-8 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">¿Qué sigue?</h2>
          <ul className="text-sm text-gray-900/60 space-y-2 text-left max-w-md mx-auto">
            <li>✓ Recibirás un email con tu link de seguimiento</li>
            <li>✓ Tu pieza está apartada por 15 días</li>
            <li>✓ Puedes pagar el saldo restante desde tu link de seguimiento</li>
            <li>✓ Una vez completado el pago, procesaremos tu envío</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-6 mb-8">
          <h2 className="text-sm font-medium text-gray-900 mb-3">
            📧 Revisa tu email
          </h2>
          <p className="text-sm text-gray-700">
            Te enviamos un email con tu link de seguimiento de apartado.
            Guárdalo para acceder en cualquier momento.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/catalogo"
            className="border border-[#FF69B4]/20 text-gray-900 px-8 py-3 hover:border-[#FF69B4] transition-colors"
          >
            Ver más productos
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

export default function LayawaySuccessPage() {
  return (
    <Suspense fallback={<div className="pt-28 pb-24 text-center">Cargando...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
