import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/admin/clientes/metrics
 * 
 * Retorna métricas del dashboard de clientes:
 * - Total clientes
 * - Clientes con compras
 * - Pagos pendientes
 * - Pagos en revisión
 * - Pendientes de dirección
 * - Apartados activos
 * - Valor total vendido
 * - Saldo pendiente total
 */
export async function GET() {
  try {
    // Auth check
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Total clientes (DISTINCT emails de orders + layaways + customer_profiles)
    const { data: ordersEmails } = await supabaseAdmin
      .from('orders')
      .select('customer_email')
    
    const { data: layawaysEmails } = await supabaseAdmin
      .from('layaways')
      .select('customer_email')
    
    const { data: profilesEmails } = await supabaseAdmin
      .from('customer_profiles')
      .select('email')
    
    const uniqueEmails = new Set([
      ...(ordersEmails || []).map(o => o.customer_email.toLowerCase()),
      ...(layawaysEmails || []).map(l => l.customer_email.toLowerCase()),
      ...(profilesEmails || []).map(p => p.email.toLowerCase())
    ])
    
    const totalCustomers = uniqueEmails.size

    // 2. Clientes con compras confirmadas
    const { data: confirmedOrders } = await supabaseAdmin
      .from('orders')
      .select('customer_email')
      .eq('status', 'confirmed')
    
    const customersWithPurchases = new Set(
      (confirmedOrders || []).map(o => o.customer_email.toLowerCase())
    ).size

    // 3. Pagos pendientes
    const { count: pendingPayments } = await supabaseAdmin
      .from('payment_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    // 4. Pagos en revisión
    const { count: paymentsUnderReview } = await supabaseAdmin
      .from('payment_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'proof_uploaded')

    // 5. Pendientes de dirección
    const { count: pendingAddress } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('shipping_status', ['pending', 'preparing'])
      .or('shipping_address.is.null,shipping_address.eq.')

    // 6. Apartados activos
    const { count: activeLayaways } = await supabaseAdmin
      .from('layaways')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')

    // 7. Valor total vendido
    const { data: salesData } = await supabaseAdmin
      .from('orders')
      .select('total')
      .eq('status', 'confirmed')

    const totalSalesValue = salesData?.reduce((sum, order) => sum + Number(order.total), 0) || 0

    // 8. Saldo pendiente total
    const { data: balanceData } = await supabaseAdmin
      .from('layaways')
      .select('amount_remaining')
      .in('status', ['active', 'pending'])

    const totalBalanceDue = balanceData?.reduce((sum, layaway) => sum + Number(layaway.amount_remaining), 0) || 0

    return NextResponse.json({
      total_customers: totalCustomers,
      customers_with_purchases: customersWithPurchases,
      pending_payments_count: pendingPayments || 0,
      payments_under_review_count: paymentsUnderReview || 0,
      pending_address_count: pendingAddress || 0,
      active_layaways_count: activeLayaways || 0,
      total_sales_value: totalSalesValue,
      total_balance_due: totalBalanceDue
    })

  } catch (error: any) {
    console.error('[CLIENTES METRICS] Error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
