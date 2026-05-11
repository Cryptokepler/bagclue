'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabaseCustomer } from '@/lib/supabase-customer'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      // Sign out directly from browser (not via route handler)
      const { error } = await supabaseCustomer.auth.signOut()
      
      if (error) {
        console.error('Logout error:', error)
        setLoading(false)
        return
      }

      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-sm text-gray-400 hover:text-[#FF69B4] transition-colors disabled:opacity-50"
    >
      {loading ? 'Saliendo...' : 'Cerrar sesión'}
    </button>
  )
}
