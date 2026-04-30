'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseCustomer } from '@/lib/supabase-customer'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  // Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setMessage(null)

    try {
      const { error } = await supabaseCustomer.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        console.error('Google sign in error:', error)
        setMessage({
          type: 'error',
          text: 'Error al iniciar sesión con Google',
        })
        setGoogleLoading(false)
      }
      // Si no hay error, el navegador redirige a Google
    } catch (error) {
      console.error('Google sign in error:', error)
      setMessage({
        type: 'error',
        text: 'Error de conexión. Intenta de nuevo.',
      })
      setGoogleLoading(false)
    }
  }

  // Magic Link Sign In
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({
          type: 'success',
          text: '✉️ Revisa tu correo - te enviamos el enlace de acceso',
        })
        setEmail('')
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Error al enviar el enlace',
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error de conexión. Intenta de nuevo.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-2">Iniciar Sesión</h1>
      <p className="text-gray-600 text-center mb-8">
        Accede a tu cuenta de Bagclue
      </p>

      {/* Google Sign In - Primary */}
      <button
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
        className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3 mb-6"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {googleLoading ? 'Redirigiendo...' : 'Continuar con Google'}
      </button>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">o usa tu correo</span>
        </div>
      </div>

      {/* Magic Link - Secondary */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@correo.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading || googleLoading}
          />
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Enviando...' : 'Enviar enlace mágico'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <a href="/" className="text-sm text-gray-600 hover:text-gray-800">
          ← Volver a la tienda
        </a>
      </div>
    </div>
  )
}
