import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { ClienteDetailResponse } from '@/types/admin-clientes'

/**
 * GET /api/admin/clientes/[id]
 * 
 * Retorna detalle completo de un cliente
 * [id] puede ser:
 * - user_id (UUID) para clientes registrados
 * - email (URL-encoded) para clientes guest
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const clientId = decodeURIComponent(id)
    
    // Determine if this is a user_id (UUID) or email
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)
    
    let profile = null
    let addresses: any[] = []
    let isRegistered = false

    if (isUUID) {
      // Registered customer - fetch profile
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('customer_profiles')
        .select('*')
        .eq('user_id', clientId)
        .single()

      if (profileError) {
        console.error('[CLIENTE DETAIL] Profile error:', profileError)
      } else {
        profile = {
          user_id: profileData.user_id,
          email: profileData.email,
          name: profileData.name,
          phone: profileData.phone,
          phone_country_code: profileData.phone_country_code,
          phone_country_iso: profileData.phone_country_iso,
          registered_at: profileData.created_at,
          welcome_email_sent_at: profileData.welcome_email_sent_at,
          first_purchase_at: null,
          type: 'registered' as const
        }
        isRegistered = true
      }

      // Fetch addresses
      const { data: addressesData, error: addressesError } = await supabaseAdmin
        .from('customer_addresses')
        .select('*')
        .eq('user_id', clientId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (addressesError) {
        console.error('[CLIENTE DETAIL] Addresses error:', addressesError)
      } else {
        addresses = addressesData || []
      }
    }

    // If no profile found (guest or failed UUID lookup), build from orders
    if (!profile) {
      const email = isUUID ? null : clientId
      const { data: firstOrder, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('customer_email, customer_name, customer_phone, created_at')
        .or(isUUID ? `user_id.eq.${clientId}` : `customer_email.eq.${email}`)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (orderError || !firstOrder) {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
      }

      profile = {
        user_id: null,
        email: firstOrder.customer_email,
        name: firstOrder.customer_name,
        phone: firstOrder.customer_phone,
        phone_country_code: null,
        phone_country_iso: null,
        registered_at: null,
        welcome_email_sent_at: null,
        first_purchase_at: firstOrder.created_at,
        type: 'guest' as const
      }
    }

    // Fetch orders
    const { data: ordersData, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        customer_name,
        customer_email,
        total,
        status,
        payment_status,
        shipping_status,
        created_at,
        tracking_token,
        tracking_number,
        shipping_proof_url,
        order_items (
          product_id,
          quantity,
          price,
          products (
            title,
            brand
          )
        )
      `)
      .or(isRegistered ? `user_id.eq.${clientId}` : `customer_email.eq.${profile.email}`)
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('[CLIENTE DETAIL] Orders error:', ordersError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const orders = (ordersData || []).map((order: any) => ({
      id: order.id,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      total: Number(order.total),
      status: order.status,
      payment_status: order.payment_status,
      shipping_status: order.shipping_status,
      created_at: order.created_at,
      tracking_token: order.tracking_token,
      tracking_number: order.tracking_number,
      shipping_proof_url: order.shipping_proof_url,
      items: (order.order_items || []).map((item: any) => ({
        product_id: item.product_id,
        product_title: item.products?.title,
        product_brand: item.products?.brand,
        quantity: item.quantity,
        price: Number(item.price)
      }))
    }))

    // Fetch layaways
    const { data: layawaysData, error: layawaysError } = await supabaseAdmin
      .from('layaways')
      .select(`
        id,
        product_id,
        total_amount,
        amount_paid,
        amount_remaining,
        status,
        next_payment_due_date,
        next_payment_amount,
        created_at,
        layaway_token,
        products (
          title,
          brand
        )
      `)
      .or(isRegistered ? `user_id.eq.${clientId}` : `customer_email.eq.${profile.email}`)
      .order('created_at', { ascending: false })

    if (layawaysError) {
      console.error('[CLIENTE DETAIL] Layaways error:', layawaysError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const layaways = (layawaysData || []).map((layaway: any) => ({
      id: layaway.id,
      product_id: layaway.product_id,
      product_title: layaway.products?.title,
      product_brand: layaway.products?.brand,
      total_amount: Number(layaway.total_amount),
      amount_paid: Number(layaway.amount_paid),
      amount_remaining: Number(layaway.amount_remaining),
      status: layaway.status,
      next_payment_due_date: layaway.next_payment_due_date,
      next_payment_amount: layaway.next_payment_amount ? Number(layaway.next_payment_amount) : null,
      created_at: layaway.created_at,
      layaway_token: layaway.layaway_token
    }))

    // Fetch payment reviews
    const orderIds = orders.map(o => o.id)
    const layawayIds = layaways.map(l => l.id)

    let paymentReviews: any[] = []
    if (orderIds.length > 0 || layawayIds.length > 0) {
      const { data: reviewsData, error: reviewsError } = await supabaseAdmin
        .from('payment_transactions')
        .select('*')
        .eq('status', 'proof_uploaded')
        .or(
          orderIds.length > 0
            ? `order_id.in.(${orderIds.join(',')}),layaway_id.in.(${layawayIds.join(',')})`
            : `layaway_id.in.(${layawayIds.join(',')})`
        )
        .order('proof_uploaded_at', { ascending: false })

      if (reviewsError) {
        console.error('[CLIENTE DETAIL] Payment reviews error:', reviewsError)
      } else {
        paymentReviews = (reviewsData || []).map((review: any) => ({
          id: review.id,
          payment_type: review.payment_type,
          payment_method: review.payment_method,
          amount: Number(review.amount),
          currency: review.currency,
          status: review.status,
          proof_url: review.proof_url,
          proof_uploaded_at: review.proof_uploaded_at,
          created_at: review.created_at,
          order_id: review.order_id,
          layaway_id: review.layaway_id
        }))
      }
    }

    // Calculate stats
    const stats = {
      total_spent: orders
        .filter(o => o.status === 'confirmed')
        .reduce((sum, o) => sum + o.total, 0),
      total_orders: orders.length,
      total_layaways: layaways.length,
      balance_due: layaways
        .filter(l => l.status === 'active' || l.status === 'pending')
        .reduce((sum, l) => sum + l.amount_remaining, 0),
      payments_under_review: paymentReviews.length,
      last_purchase_at: orders.length > 0 ? orders[0].created_at : null
    }

    const response: ClienteDetailResponse = {
      profile,
      addresses,
      stats,
      orders,
      layaways,
      payment_reviews: paymentReviews
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('[CLIENTE DETAIL] Error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
