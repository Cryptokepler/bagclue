'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseCustomer } from '@/lib/supabase-customer'

export default function CartPage() {
  const { items, removeFromCart, clearCart, cartTotal } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // Load user data if logged in
  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user }, error } = await supabaseCustomer.auth.getUser()
        
        if (!error && user) {
          setUser(user)
          setCustomerEmail(user.email || '')
          
          // Load profile data
          const { data: profile } = await supabaseCustomer
            .from('customer_profiles')
            .select('name, phone')
            .eq('user_id', user.id)
            .single()
          
          if (profile) {
            if (profile.name) setCustomerName(profile.name)
            if (profile.phone) setCustomerPhone(profile.phone)
          }
        }
      } catch (e) {
        console.error('[CART] Error loading user data:', e)
      } finally {
        setLoadingUser(false)
      }
    }
    
    loadUserData()
  }, [])

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Get access token if user is logged in
      const { data: { session } } = await supabaseCustomer.auth.getSession()
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      // Fallback: si usuario logueado sin nombre, usar email antes de @
      let finalName = customerName
      if (user && !customerName && customerEmail) {
        finalName = customerEmail.split('@')[0]
      }

      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: items.map(item => ({ product_id: item.product_id })),
          customer_name: finalName,
          customer_email: customerEmail,
          customer_phone: customerPhone || undefined
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
          {user ? (
            /* Usuario logueado: Resumen sin formulario */
            <div className="bg-[#FF69B4]/5 border border-[#FF69B4]/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Comprar como
                </h2>
                <Link
                  href="/account/profile"
                  className="text-sm text-[#FF69B4] hover:underline"
                >
                  Editar perfil
                </Link>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#FF69B4] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-900/60">Email</p>
                    <p className="text-sm text-gray-900 break-words">{customerEmail}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#FF69B4] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-900/60">Nombre</p>
                    <p className="text-sm text-gray-900 break-words">
                      {customerName || <span className="text-gray-900/40 italic">Sin nombre en perfil</span>}
                    </p>
                  </div>
                </div>
                {customerPhone && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#FF69B4] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-900/60">Teléfono</p>
                      <p className="text-sm text-gray-900 break-words">{customerPhone}</p>
                    </div>
                  </div>
                )}
              </div>
              {!customerName && (
                <div className="mt-4 pt-4 border-t border-[#FF69B4]/10">
                  <p className="text-xs text-gray-900/60">
                    ⚠️ Falta tu nombre en el perfil. <Link href="/account/profile" className="text-[#FF69B4] hover:underline">Completar ahora</Link>
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Usuario guest: Formulario completo */
            <div className="bg-[#FF69B4]/5 border border-[#FF69B4]/20 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Datos de contacto
              </h2>
              <div className="space-y-4">
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
                  <label className="block text-sm text-gray-900/60 mb-2">Teléfono (opcional)</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full border border-[#FF69B4]/20 text-gray-900 px-4 py-2 focus:border-[#FF69B4] outline-none"
                    placeholder="+52 55 1234 5678"
                  />
                </div>
              </div>
            </div>
          )}

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
