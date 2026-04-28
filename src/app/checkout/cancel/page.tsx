'use client'

import { useRouter } from 'next/navigation'

export default function CheckoutCancelPage() {
  const router = useRouter()
  return (
    <div className="pt-28 pb-24">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-gray-500/20 rounded-full mx-auto flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl text-gray-900 mb-4">
            Pago Cancelado
          </h1>
          <p className="text-gray-900/60 mb-8">
            No se realizó ningún cargo. Puedes intentar nuevamente cuando estés lista.
          </p>
        </div>

        <div className="bg-[#FF69B4]/5 border border-[#FF69B4]/20 p-8 mb-8">
          <p className="text-sm text-gray-900/60">
            Tu carrito sigue disponible. Los productos reservados volverán a estar disponibles si no completas la compra en 30 minutos.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={() => {
              console.log('Navigating to /cart')
              router.push('/cart')
            }}
            className="bg-[#FF69B4] text-white px-8 py-3 hover:bg-[#FF69B4]/90 transition-colors cursor-pointer"
          >
            Volver al carrito
          </button>
          <button
            type="button"
            onClick={() => {
              console.log('Navigating to /catalogo')
              router.push('/catalogo')
            }}
            className="border border-[#FF69B4]/20 text-gray-900 px-8 py-3 hover:border-[#FF69B4] transition-colors cursor-pointer"
          >
            Seguir comprando
          </button>
        </div>
      </div>
    </div>
  )
}
