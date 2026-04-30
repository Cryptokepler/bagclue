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
  created_at: string
  updated_at: string
}

export default function AccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [userEmail, setUserEmail] = useState<string | undefined>()

  useEffect(() => {
    const loadProfile = async () => {
      // Check authentication
      const { data: { user }, error: authError } = await supabaseCustomer.auth.getUser()

      if (authError || !user) {
        router.push('/account/login')
        return
      }

      setUserEmail(user.email)

      // Fetch customer profile
      const { data: profileData, error: profileError } = await supabaseCustomer
        .from('customer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profileData) {
        console.error('Profile fetch error:', profileError)
        router.push('/account/login')
        return
      }

      setProfile(profileData)
      setLoading(false)
    }

    loadProfile()
  }, [router])

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando tu cuenta...</p>
      </div>
    )
  }

  return (
    <AccountLayout userEmail={userEmail}>
      <AccountDashboard profile={profile} />
    </AccountLayout>
  )
}
