import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import AccountLayout from '@/components/customer/AccountLayout'
import { supabaseCustomer } from '@/lib/supabase-customer'
import LayawayPaymentRow from '@/components/customer/LayawayPaymentRow'
import LayawayPolicyCard from '@/components/customer/LayawayPolicyCard'
import { Layaway, formatPlanType, formatLayawayStatus } from '@/types/layaway'

async function getLayawayDetail(id: string) {
  try {
    const { data: { user }, error: userError } = await supabaseCustomer.auth.getUser()
    
    if (userError || !user) {
      return null
    }
    
    // Get layaway with product and payments - RLS will ensure user owns this layaway
    const { data: layaway, error } = await supabaseCustomer
      .from('layaways')
      .select(`
        *,
        product:products(
          title,
          image_url,
          slug,
          description
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
      return undefined
    }
    
    // Ordenar payments por payment_number
    if (layaway && layaway.payments) {
      layaway.payments.sort((a, b) => a.payment_number - b.payment_number)
    }
    
    return layaway as Layaway
  } catch (error) {
    console.error('[LAYAWAY DETAIL] Unexpected error:', error)
    return undefined
  }
}

export default async function LayawayDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const layaway = await getLayawayDetail(params.id)
  
  if (layaway === null) {
    redirect('/account/login')
  }
  
  if (layaway === undefined) {
    notFound()
  }
  
  const { data: { user } } = await supabaseCustomer.auth.getUser()
  
  const statusInfo = formatLayawayStatus(layaway.status)
  const planLabel = formatPlanType(layaway.plan_type)
  
  const paymentsCompleted = layaway.payments_completed || 0
  const totalPayments = layaway.total_payments || 0
  const totalAmount = layaway.total_amount || 0
  const amountPaid = layaway.amount_paid || 0
  const amountRemaining = layaway.amount_remaining || 0
  const firstPaymentAmount = layaway.first_payment_amount || 0
  
  // Calcular próximo pago pendiente
  const nextPayment = layaway.payments?.find(p => p.status === 'pending')
  
  // Historial de pagos completados
  const paidPayments = layaway.payments?.filter(p => p.status === 'paid') || []
  
  return (
    <AccountLayout userEmail={user?.email}>
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
            {/* Imagen del producto */}
            {layaway.product?.image_url && (
              <div className="relative w-full md:w-48 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={layaway.product.image_url}
                  alt={layaway.product.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
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
                    Vence: {new Date(nextPayment.due_date).toLocaleDateString('es-MX', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    El pago de cuotas estará disponible próximamente.
                  </p>
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
                      {payment.paid_at && new Date(payment.paid_at).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
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
