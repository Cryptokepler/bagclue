'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import AccountLayout from '@/components/customer/AccountLayout'
import { supabaseCustomer } from '@/lib/supabase-customer'
import LayawayPaymentRow from '@/components/customer/LayawayPaymentRow'
import LayawayPolicyCard from '@/components/customer/LayawayPolicyCard'
import { Layaway, formatPlanType, formatLayawayStatus } from '@/types/layaway'

// Helper para formatear fecha sin timezone shift
const formatDateSafe = (dateString: string | null): string => {
  if (!dateString) return '—'
  // Extraer solo YYYY-MM-DD sin conversión de timezone
  const dateOnly = dateString.split('T')[0]
  const [year, month, day] = dateOnly.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function LayawayDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [layaway, setLayaway] = useState<Layaway | null>(null)
  const [userEmail, setUserEmail] = useState<string | undefined>()
  const [notFound, setNotFound] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  useEffect(() => {
    const loadDetail = async () => {
      try {
        // Validar ID antes de consultar
        if (!id || id === 'undefined') {
          console.error('[LAYAWAY DETAIL] Invalid ID:', id)
          setNotFound(true)
          setLoading(false)
          return
        }
        
        const { data: { user }, error: userError } = await supabaseCustomer.auth.getUser()
        
        if (userError || !user) {
          router.push('/account/login')
          return
        }
        
        setUserEmail(user.email)
        
        console.log('[LAYAWAY DETAIL] Loading layaway ID:', id)
        
        // Get layaway with product and payments - RLS will ensure user owns this layaway
        const { data: layawayData, error } = await supabaseCustomer
          .from('layaways')
          .select(`
            *,
            product:products(
              title,
              slug,
              description,
              product_images(url)
            ),
            payments:layaway_payments(
              id,
              payment_number,
              amount_due,
              amount_paid,
              due_date,
              paid_at,
              status,
              payment_type,
              created_at
            )
          `)
          .eq('id', id)
          .single()
        
        if (error) {
          console.error('[LAYAWAY DETAIL] Error fetching layaway:', error)
          setNotFound(true)
          setLoading(false)
          return
        }
        
        // Ordenar payments por payment_number
        if (layawayData && layawayData.payments) {
          layawayData.payments.sort((a: any, b: any) => a.payment_number - b.payment_number)
        }
        
        setLayaway(layawayData as unknown as Layaway)
        setLoading(false)
      } catch (error) {
        console.error('[LAYAWAY DETAIL] Unexpected error:', error)
        setNotFound(true)
        setLoading(false)
      }
    }

    if (id) {
      loadDetail()
    }
  }, [id])

  const handlePayInstallment = async () => {
    if (!layaway || !nextPayment) {
      return
    }
    
    try {
      setPaymentLoading(true)
      setPaymentError(null)
      
      // Get access token from Supabase Auth
      const { data: { session }, error: sessionError } = await supabaseCustomer.auth.getSession()
      
      if (sessionError || !session) {
        setPaymentError('Sesión expirada. Por favor, inicia sesión nuevamente.')
        setPaymentLoading(false)
        return
      }
      
      const accessToken = session.access_token
      
      // Call pay-installment endpoint
      const response = await fetch(`/api/layaways/${layaway.id}/pay-installment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_number: nextPayment.payment_number
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setPaymentError(data.error || 'Error al crear la sesión de pago')
        setPaymentLoading(false)
        return
      }
      
      // Redirect to Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        setPaymentError('No se recibió la URL de pago')
        setPaymentLoading(false)
      }
      
    } catch (error) {
      console.error('[PAY INSTALLMENT] Error:', error)
      setPaymentError('Error inesperado al procesar el pago')
      setPaymentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cargando apartado...</p>
        </div>
      </div>
    )
  }

  if (notFound || !layaway) {
    return (
      <AccountLayout userEmail={userEmail}>
        <div className="max-w-2xl mx-auto mt-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-4">🔍</p>
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              Apartado no encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              El apartado que buscas no existe o no tienes acceso a él.
            </p>
            <Link
              href="/account/layaways"
              className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              ← Volver a Mis Apartados
            </Link>
          </div>
        </div>
      </AccountLayout>
    )
  }

  const statusInfo = formatLayawayStatus(layaway.status)
  const planLabel = formatPlanType(layaway.plan_type)
  
  const paymentsCompleted = layaway.payments_completed || 0
  const totalPayments = layaway.total_payments || 0
  const totalAmount = layaway.total_amount || 0
  const amountPaid = layaway.amount_paid || 0
  const amountRemaining = layaway.amount_remaining || 0
  
  // Calcular próximo pago pendiente
  const nextPayment = layaway.payments?.find(p => p.status === 'pending')
  
  // Historial de pagos completados
  const paidPayments = layaway.payments?.filter(p => p.status === 'paid') || []
  
  return (
    <AccountLayout userEmail={userEmail}>
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <Link href="/account/layaways" className="hover:text-gray-900">
            Mis Apartados
          </Link>
          <span>→</span>
          <span className="text-gray-900 font-medium truncate">
            {layaway.product?.title || 'Detalle'}
          </span>
        </nav>
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Imagen del producto - fallback siempre sin Image de Next.js */}
            <div className="relative w-full md:w-48 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs">Sin imagen</p>
              </div>
            </div>
            
            {/* Info principal */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {layaway.product?.title || 'Producto'}
              </h1>
              
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                  statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                  statusInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {statusInfo.icon} {statusInfo.label}
                </span>
                
                <span className="text-sm text-gray-600">
                  {planLabel}
                </span>
              </div>
              
              {/* Montos */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 mb-1">Pagado</p>
                  <p className="text-lg font-bold text-green-600">
                    ${amountPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 mb-1">Saldo</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${amountRemaining.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 mb-1">Progreso</p>
                  <p className="text-lg font-bold text-blue-600">
                    {paymentsCompleted}/{totalPayments}
                  </p>
                </div>
              </div>
              
              {/* Próximo pago */}
              {nextPayment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    📅 Próximo pago
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${nextPayment.amount_due.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Vence: {formatDateSafe(nextPayment.due_date)}
                  </p>
                  
                  {/* Botón pagar cuota - solo si layaway está activo y hay saldo pendiente */}
                  {(layaway.status === 'active' || layaway.status === 'overdue') && 
                   amountRemaining > 0 && (
                    <div className="mt-4">
                      {paymentError && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                          {paymentError}
                        </div>
                      )}
                      
                      <button
                        onClick={handlePayInstallment}
                        disabled={paymentLoading}
                        className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                          paymentLoading 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {paymentLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                            Creando sesión de pago...
                          </span>
                        ) : (
                          `Pagar próxima cuota — $${nextPayment.amount_due.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`
                        )}
                      </button>
                      
                      <p className="text-xs text-blue-600 mt-2 text-center">
                        Serás redirigido a Stripe para completar el pago de forma segura
                      </p>
                    </div>
                  )}
                  
                  {/* Mensaje si no se puede pagar */}
                  {layaway.status !== 'active' && layaway.status !== 'overdue' && (
                    <p className="text-xs text-gray-600 mt-2">
                      El apartado debe estar activo para realizar pagos.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Calendario de pagos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📅 Calendario de pagos
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha pago
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {layaway.payments?.map(payment => (
                  <LayawayPaymentRow 
                    key={payment.id} 
                    payment={payment}
                    isNext={payment.id === nextPayment?.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Historial de pagos */}
        {paidPayments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              ✅ Historial de pagos realizados
            </h2>
            
            <div className="space-y-3">
              {paidPayments.map(payment => (
                <div 
                  key={payment.id}
                  className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      Pago #{payment.payment_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDateSafe(payment.paid_at)}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-700">
                      ${payment.amount_due.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-green-600">
                      ✓ Pagado
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Política del apartado */}
        <LayawayPolicyCard policyVersion={layaway.policy_version || 2} />
      </div>
    </AccountLayout>
  )
}
