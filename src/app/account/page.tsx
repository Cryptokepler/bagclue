'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseCustomer } from '@/lib/supabase-customer'
import AccountLayout from '@/components/customer/AccountLayout'
import AccountDashboard from '@/components/customer/AccountDashboard'

interface CustomerProfile {
  id: string
  user_id: string
  email: string
  name: string | null
  phone: string | null
  phone_country_code: string | null
  phone_country_iso: string | null
  created_at: string
  updated_at: string
}

export default function AccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [userEmail, setUserEmail] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Timeout protection: max 5 seconds for auth check
        const authCheckPromise = supabaseCustomer.auth.getUser()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 5000)
        )

        const { data: { user }, error: authError } = await Promise.race([
          authCheckPromise,
          timeoutPromise
        ]) as any

        if (authError) {
          // AuthSessionMissingError is EXPECTED when user is not logged in
          const isSessionMissing = authError.name === 'AuthSessionMissingError' || 
                                   authError.message?.includes('session_missing') ||
                                   authError.message?.includes('Auth session missing')
          
          if (isSessionMissing) {
            // Not logged in - redirect to login without error param
            router.push('/account/login')
          } else {
            // Real error - log it and redirect with error param
            console.error('Auth error:', authError)
            router.push('/account/login?error=session_expired')
          }
          return
        }

        if (!user) {
          router.push('/account/login')
          return
        }

        setUserEmail(user.email)

        // Fetch customer profile with timeout
        const profilePromise = supabaseCustomer
          .from('customer_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        const profileTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 5000)
        )

        const { data: profileData, error: profileError } = await Promise.race([
          profilePromise,
          profileTimeoutPromise
        ]) as any

        if (profileError) {
          console.error('Profile fetch error:', profileError)
          
          if (profileError.message === 'timeout') {
            setError('Timeout cargando perfil. Revisa tu conexión.')
          } else {
            setError('Error cargando tu perfil. Intenta de nuevo.')
          }
          
          setLoading(false)
          return
        }

        if (!profileData) {
          console.error('No profile found for user:', user.id)
          setError('No se encontró tu perfil. Contacta soporte.')
          setLoading(false)
          return
        }

        setProfile(profileData)
        setLoading(false)
      } catch (error: any) {
        // Check if it's just missing session (expected state)
        const isSessionMissing = error.name === 'AuthSessionMissingError' || 
                                 error.message?.includes('session_missing') ||
                                 error.message?.includes('Auth session missing')
        
        if (isSessionMissing) {
          // Not logged in - just redirect to login
          router.push('/account/login')
          return
        }
        
        // Real error - log it
        console.error('Load profile failed:', error)
        
        if (error.message === 'timeout') {
          setError('Timeout verificando sesión. Revisa tu conexión.')
        } else {
          setError('Error cargando tu cuenta.')
        }
        
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  // Loading state (max 5s due to timeout)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cargando tu cuenta...</p>
          <p className="text-xs text-gray-400 mt-2">Máximo 5 segundos</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700"
            >
              Reintentar
            </button>
            <button
              onClick={async () => {
                await supabaseCustomer.auth.signOut()
                router.push('/account/login')
              }}
              className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300"
            >
              Cerrar sesión y volver a login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // No profile state (shouldn't happen after checks above)
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">Perfil no encontrado</h2>
          <p className="text-gray-700 mb-6">
            Tu cuenta existe pero no se encontró tu perfil de cliente.
          </p>
          <button
            onClick={() => router.push('/account/login')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700"
          >
            Volver a login
          </button>
        </div>
      </div>
    )
  }

  // Success state - show account dashboard
  return (
    <AccountLayout userEmail={userEmail}>
      <AccountDashboard profile={profile} />
    </AccountLayout>
  )
}
