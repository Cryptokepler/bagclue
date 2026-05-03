'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AccountLayout from '@/components/customer/AccountLayout'
import ProfileForm from '@/components/customer/ProfileForm'
import SupportSection from '@/components/customer/SupportSection'
import { supabaseCustomer } from '@/lib/supabase-customer'

export default function CustomerProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<any>(null)
  const [userEmail, setUserEmail] = useState<string | undefined>()
  const [authToken, setAuthToken] = useState<string>('')

  useEffect(() => {
    checkAuthAndLoadProfile()
  }, [])

  const checkAuthAndLoadProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabaseCustomer.auth.getUser()
      
      if (userError || !user) {
        router.push('/account/login')
        return
      }
      
      setUserEmail(user.email)
      
      // Get session token
      const { data: { session } } = await supabaseCustomer.auth.getSession()
      
      if (!session?.access_token) {
        console.error('No access token available')
        router.push('/account/login')
        return
      }
      
      setAuthToken(session.access_token)
      await loadProfile(session.access_token)
      
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/account/login')
    }
  }

  const loadProfile = async (token?: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/customer/profile', {
        headers: {
          'Authorization': `Bearer ${token || authToken}`
        }
      })

      if (response.status === 401) {
        router.push('/account/login')
        return
      }

      if (!response.ok) {
        throw new Error('Error al cargar perfil')
      }

      const data = await response.json()
      setProfileData(data.profile)

    } catch (error) {
      console.error('Error loading profile:', error)
      alert('Error al cargar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async () => {
    await loadProfile()
  }

  return (
    <AccountLayout userEmail={userEmail}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-playfair tracking-wide text-gray-900 mb-2">
            Mi perfil
          </h1>
          <p className="text-gray-600">
            Administra tu información personal y preferencias
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && profileData && (
          <div className="space-y-6">
            {/* Profile Form */}
            <ProfileForm
              initialData={{
                email: profileData.email,
                name: profileData.name,
                phone: profileData.phone,
                phone_country_code: profileData.phone_country_code,
                phone_country_iso: profileData.phone_country_iso,
                created_at: profileData.created_at
              }}
              onUpdate={handleProfileUpdate}
              authToken={authToken}
            />

            {/* Support Section */}
            <SupportSection />
          </div>
        )}
      </div>
    </AccountLayout>
  )
}
