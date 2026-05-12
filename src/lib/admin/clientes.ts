import { supabaseAdmin } from '@/lib/supabase-admin'
import type { ClienteDetailResponse } from '@/types/admin-clientes'

/**
 * Función server compartida para obtener detalle de cliente
 * Usada tanto por API route como por server components
 * 
 * @param id - user_id (UUID) o email (puede venir URL-encoded)
 * @returns ClienteDetailResponse o null si no se encuentra
 */
export async function getAdminClienteDetail(id: string): Promise<ClienteDetailResponse | null> {
  try {
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
        console.error('[GET CLIENTE DETAIL] Profile error:', profileError)
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
          type: 'registered' as const,
          internal_notes: profileData.internal_notes,
          archived_at: profileData.archived_at
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
        console.error('[GET CLIENTE DETAIL] Addresses error:', addressesError)
      } else {
        addresses = addressesData || []
      }
    }

    // If no profile found (guest or failed UUID lookup), try to build from email
    if (!profile) {
      const email = isUUID ? null : clientId
      
      // Si es email, primero intentar buscar profile por email (puede ser guest con profile)
      if (!isUUID && email) {
        const { data: profileByEmail } = await supabaseAdmin
          .from('customer_profiles')
          .select('*')
          .ilike('email', email)
          .maybeSingle()
        
        if (profileByEmail) {
          profile = {
            user_id: profileByEmail.user_id,
            email: profileByEmail.email,
            name: profileByEmail.name,
            phone: profileByEmail.phone,
            phone_country_code: profileByEmail.phone_country_code,
            phone_country_iso: profileByEmail.phone_country_iso,
            registered_at: profileByEmail.created_at,
            welcome_email_sent_at: profileByEmail.welcome_email_sent_at,
            first_purchase_at: null,
            type: (profileByEmail.user_id ? 'registered' : 'guest') as 'registered' | 'guest',
            internal_notes: profileByEmail.internal_notes,
            archived_at: profileByEmail.archived_at
          }
          
          // Si tiene user_id, actualizar isRegistered
          if (profileByEmail.user_id) {
            isRegistered = true
            
            // Fetch addresses
            const { data: addressesData } = await supabaseAdmin
              .from('customer_addresses')
              .select('*')
              .eq('user_id', profileByEmail.user_id)
              .order('is_default', { ascending: false })
              .order('created_at', { ascending: false })
            
            addresses = addressesData || []
          }
        }
      }
      
      // Si no encontró profile por email, intentar construir desde orders
      if (!profile) {
        let ordersQuery = supabaseAdmin
          .from('orders')
          .select('customer_email, customer_name, customer_phone, created_at')
          .order('created_at', { ascending: true })
          .limit(1)
        
        if (isUUID) {
          ordersQuery = ordersQuery.eq('user_id', clientId)
        } else {
          ordersQuery = ordersQuery.ilike('customer_email', email!)
        }

        const { data: firstOrder, error: orderError } = await ordersQuery.single()

        if (orderError || !firstOrder) {
          console.error('[GET CLIENTE DETAIL] No profile or orders found for clientId:', clientId)
          return null
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
          type: 'guest' as const,
          internal_notes: null,
          archived_at: null
        }
      }
    }

    // Fetch orders (case-insensitive email match + user_id para híbridos)
    const ordersBaseSelect = `
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
    `
    
    let allOrdersData: any[] = []
    
    if (isRegistered) {
      // Buscar por user_id
      const { data: ordersByUserId } = await supabaseAdmin
        .from('orders')
        .select(ordersBaseSelect)
        .eq('user_id', clientId)
      
      // Buscar por email (orders pre-registro)
      const { data: ordersByEmail } = await supabaseAdmin
        .from('orders')
        .select(ordersBaseSelect)
        .ilike('customer_email', profile.email)
        .is('user_id', null)
      
      allOrdersData = [...(ordersByUserId || []), ...(ordersByEmail || [])]
      allOrdersData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else {
      const { data: guestOrders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select(ordersBaseSelect)
        .ilike('customer_email', profile.email)
        .order('created_at', { ascending: false })
      
      if (ordersError) {
        console.error('[GET CLIENTE DETAIL] Orders error:', ordersError)
      }
      
      allOrdersData = guestOrders || []
    }

    const orders = allOrdersData.map((order: any) => ({
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

    // Fetch layaways (case-insensitive email match + user_id para híbridos)
    const layawaysBaseSelect = `
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
    `
    
    let allLayawaysData: any[] = []
    
    if (isRegistered) {
      const { data: layawaysByUserId } = await supabaseAdmin
        .from('layaways')
        .select(layawaysBaseSelect)
        .eq('user_id', clientId)
      
      const { data: layawaysByEmail } = await supabaseAdmin
        .from('layaways')
        .select(layawaysBaseSelect)
        .ilike('customer_email', profile.email)
        .is('user_id', null)
      
      allLayawaysData = [...(layawaysByUserId || []), ...(layawaysByEmail || [])]
      allLayawaysData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else {
      const { data: guestLayaways, error: layawaysError } = await supabaseAdmin
        .from('layaways')
        .select(layawaysBaseSelect)
        .ilike('customer_email', profile.email)
        .order('created_at', { ascending: false })
      
      if (layawaysError) {
        console.error('[GET CLIENTE DETAIL] Layaways error:', layawaysError)
      }
      
      allLayawaysData = guestLayaways || []
    }

    const layaways = allLayawaysData.map((layaway: any) => ({
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
        console.error('[GET CLIENTE DETAIL] Payment reviews error:', reviewsError)
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

    return {
      profile,
      addresses,
      stats,
      orders,
      layaways,
      payment_reviews: paymentReviews
    }

  } catch (error: any) {
    console.error('[GET CLIENTE DETAIL] Error:', error.message)
    return null
  }
}
