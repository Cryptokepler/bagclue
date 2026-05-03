'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AccountLayout from '@/components/customer/AccountLayout'
import { supabaseCustomer } from '@/lib/supabase-customer'
import LayawayCard from '@/components/customer/LayawayCard'
import LayawayEmptyState from '@/components/customer/LayawayEmptyState'
import { Layaway } from '@/types/layaway'

export default function LayawaysPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [layaways, setLayaways] = useState<Layaway[]>([])
  const [userEmail, setUserEmail] = useState<string | undefined>()

  useEffect(() => {
    const loadLayaways = async () => {
      try {
        const { data: { user }, error: userError } = await supabaseCustomer.auth.getUser()
        
        if (userError || !user) {
          router.push('/account/login')
          return
        }
        
        setUserEmail(user.email)
        
        // Get layaways with products and payments - RLS policy will filter to only user's layaways
        const { data: layawaysData, error } = await supabaseCustomer
          .from('layaways')
          .select(`
            id,
            user_id,
            product_id,
            customer_name,
            customer_email,
            total_amount,
            amount_paid,
            amount_remaining,
            plan_type,
            total_payments,
            payments_completed,
            payments_remaining,
            next_payment_due_date,
            next_payment_amount,
            status,
            created_at,
            product:products(
              title,
              slug,
              product_images(url)
            )
          `)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('[LAYAWAYS PAGE] Error fetching layaways:', error)
        }
        
        setLayaways((layawaysData || []) as unknown as Layaway[])
        setLoading(false)
      } catch (error) {
        console.error('[LAYAWAYS PAGE] Unexpected error:', error)
        setLoading(false)
      }
    }

    loadLayaways()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cargando apartados...</p>
        </div>
      </div>
    )
  }

  // Filtrar por estado
  const activeLayaways = layaways.filter(l => 
    ['active', 'pending', 'pending_first_payment', 'overdue'].includes(l.status || '')
  )
  
  const completedLayaways = layaways.filter(l => 
    l.status === 'completed'
  )
  
  const otherLayaways = layaways.filter(l => 
    !['active', 'pending', 'pending_first_payment', 'overdue', 'completed'].includes(l.status || '')
  )
  
  return (
    <AccountLayout userEmail={userEmail}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mis Apartados
          </h1>
          <p className="text-gray-600">
            Consulta el estado de tus apartados y el calendario de pagos.
          </p>
        </div>
        
        {/* Empty state */}
        {layaways.length === 0 && <LayawayEmptyState />}
        
        {/* Apartados activos */}
        {activeLayaways.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 text-sm font-bold">
                {activeLayaways.length}
              </span>
              Activos
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeLayaways.map(layaway => (
                <LayawayCard key={layaway.id} layaway={layaway} />
              ))}
            </div>
          </div>
        )}
        
        {/* Apartados completados */}
        {completedLayaways.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-bold">
                {completedLayaways.length}
              </span>
              Completados
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {completedLayaways.map(layaway => (
                <LayawayCard key={layaway.id} layaway={layaway} />
              ))}
            </div>
          </div>
        )}
        
        {/* Otros apartados (cancelados, vencidos, etc) */}
        {otherLayaways.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800 text-sm font-bold">
                {otherLayaways.length}
              </span>
              Historial
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {otherLayaways.map(layaway => (
                <LayawayCard key={layaway.id} layaway={layaway} />
              ))}
            </div>
          </div>
        )}
      </div>
    </AccountLayout>
  )
}
// Force redeploy
