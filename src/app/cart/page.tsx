'use client'

import { useState, FormEvent } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CartPage() {
  const { items, removeFromCart, clearCart, cartTotal } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({ product_id: item.product_id })),
          customer_name: customerName,
          customer_email: customerEmail
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al crear sesión de pago')
        setLoading(false)
        return
      }

      // Redirigir a Stripe Checkout
      window.location.href = data.url
    } catch (err) {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="pt-28 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl text-gray-900 mb-8">
            Carrito
          </h1>
          <div className="text-center py-24">
            <p className="text-gray-900/40 mb-8">Tu carrito está vacío</p>
            <Link
              href="/catalogo"
              className="inline-block border border-[#FF69B4]/20 text-gray-900 px-8 py-3 hover:border-[#FF69B4] transition-colors"
            >
              Ver Catálogo
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-28 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl text-gray-900">
            Carrito
          </h1>
          <button
            onClick={clearCart}
            className="text-sm text-gray-900/40 hover:text-red-500 transition-colors"
          >
            Vaciar carrito
          </button>
        </div>

        {/* Items */}
        <div className="space-y-4 mb-8">
          {items.map(item => (
            <div
              key={item.product_id}
              className="flex items-center gap-4 border border-[#FF69B4]/10 p-4"
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-20 h-20 object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{item.brand}</h3>
                <p className="text-sm text-gray-900/60">{item.title}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-900">
                  {item.price ? `$${item.price.toLocaleString()} ${item.currency}` : 'Consultar'}
                </p>
                <button
                  onClick={() => removeFromCart(item.product_id)}
                  className="text-xs text-gray-900/40 hover:text-red-500 transition-colors mt-2"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t border-[#FF69B4]/10 pt-4 mb-8">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-900">Total</span>
            <span className="text-2xl font-[family-name:var(--font-playfair)] text-[#FF69B4]">
              ${cartTotal.toLocaleString()} MXN
            </span>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleCheckout} className="space-y-6">
          <div className="bg-[#FF69B4]/5 border border-[#FF69B4]/20 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Datos de contacto</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-900/60 mb-2">Nombre completo *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  required
                  className="w-full border border-[#FF69B4]/20 text-gray-900 px-4 py-2 focus:border-[#FF69B4] outline-none"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-900/60 mb-2">Email *</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  required
                  className="w-full border border-[#FF69B4]/20 text-gray-900 px-4 py-2 focus:border-[#FF69B4] outline-none"
                  placeholder="tu@email.com"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF69B4] text-white font-medium py-4 hover:bg-[#FF69B4]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : 'Pagar Ahora'}
          </button>

          <p className="text-xs text-gray-900/40 text-center">
            Serás redirigido a Stripe para completar el pago de forma segura
          </p>
        </form>
      </div>
    </div>
  )
}
