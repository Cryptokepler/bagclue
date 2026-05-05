'use client'

import { useState } from 'react'

interface LayawayButtonProps {
  product: {
    id: string
    price: number
    layaway_deposit_percent: number
    currency: string
  }
}

export default function LayawayButton({ product }: LayawayButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: ''
  })

  const depositPercent = product.layaway_deposit_percent || 20
  const depositAmount = Math.round(product.price * (depositPercent / 100))
  const balanceAmount = product.price - depositAmount

  // Format numbers consistently for server/client (prevent hydration mismatch)
  const formatCurrency = (amount: number) => amount.toLocaleString('es-MX')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/layaways/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          ...formData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear apartado')
      }

      // Redirect to Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      }
    } catch (error: any) {
      alert(error.message || 'Error al procesar apartado')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full border-2 border-[#FF69B4] text-[#FF69B4] py-3 hover:bg-[#FF69B4] hover:text-white transition-colors"
      >
        <span className="block font-medium">
          Apartar con ${formatCurrency(depositAmount)} {product.currency}
        </span>
        <span className="text-xs block mt-1">
          Paga {depositPercent}% ahora, {100 - depositPercent}% en 15 días
        </span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <h2 className="text-2xl font-[family-name:var(--font-playfair)] text-gray-900 mb-4">
              Apartar pieza
            </h2>

            <div className="bg-[#FF69B4]/5 border border-[#FF69B4]/20 p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Depósito inicial ({depositPercent}%)</span>
                <span className="font-medium text-gray-900">${formatCurrency(depositAmount)} {product.currency}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Saldo restante</span>
                <span className="text-sm text-gray-700">${formatCurrency(balanceAmount)} {product.currency}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#FF69B4]/20">
                <span className="font-medium text-gray-900">Total</span>
                <span className="font-medium text-[#FF69B4]">${formatCurrency(product.price)} {product.currency}</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              • Tienes <strong>15 días</strong> para pagar el saldo<br/>
              • El depósito <strong>no es reembolsable</strong><br/>
              • Recibirás un link de seguimiento por email
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:border-[#FF69B4] focus:outline-none"
                  placeholder="María García"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:border-[#FF69B4] focus:outline-none"
                  placeholder="maria@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:border-[#FF69B4] focus:outline-none"
                  placeholder="+52 55 1234 5678"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF69B4] text-white py-3 hover:bg-[#FF69B4]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Procesando...' : `Continuar al pago de $${formatCurrency(depositAmount)}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
