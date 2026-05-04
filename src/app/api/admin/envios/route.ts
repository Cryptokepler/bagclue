import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ========================================
// ADMIN FASE 1B.1 — API GET /api/admin/envios
// Endpoint readonly para vista de envíos/fulfillment
// ========================================

export async function GET(request: NextRequest) {
  try {
    // ========================================
    // 1. AUTH CHECK
    // ========================================
    const authenticated = await isAuthenticated()
    
    if (!authenticated) {
      return NextResponse.json({ 
        error: 'Unauthorized. Admin session required.' 
      }, { status: 401 })
    }

    // ========================================
    // 2. PARSE QUERY PARAMS
    // ========================================
    const { searchParams } = new URL(request.url)
    
    const filter = searchParams.get('filter') || 'all'
    const search = searchParams.get('search') || ''
    const limitParam = parseInt(searchParams.get('limit') || '25', 10)
    const offsetParam = parseInt(searchParams.get('offset') || '0', 10)
    
    // Validar limit (min 1, max 100, default 25)
    const limit = Math.max(1, Math.min(limitParam, 100))
    const offset = Math.max(0, offsetParam)
    
    // Validar filter
    const validFilters = ['all', 'pending_address', 'pending_shipment', 'preparing', 'shipped', 'delivered']
    if (!validFilters.includes(filter)) {
      return NextResponse.json({ 
        error: `Invalid filter. Must be one of: ${validFilters.join(', ')}` 
      }, { status: 400 })
    }

    // ========================================
    // 3. BUILD QUERY BASE
    // ========================================
    let query = supabaseAdmin
      .from('orders')
      .select(`
        id,
        created_at,
        customer_name,
        customer_email,
        customer_phone,
        total,
        currency,
        payment_status,
        status,
        shipping_status,
        shipping_address,
        shipping_provider,
        tracking_number,
        tracking_url,
        tracking_token,
        shipped_at,
        delivered_at,
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          subtotal,
          product_snapshot
        )
      `)

    // ========================================
    // 4. APPLY FILTERS
    // ========================================
    
    // Filter: pending_address
    // payment_status = paid AND shipping_address IS NULL
    if (filter === 'pending_address') {
      query = query
        .eq('payment_status', 'paid')
        .is('shipping_address', null)
    }
    
    // Filter: pending_shipment
    // payment_status = paid AND shipping_address NOT NULL AND shipping_status IN (NULL, 'pending')
    else if (filter === 'pending_shipment') {
      query = query
        .eq('payment_status', 'paid')
        .not('shipping_address', 'is', null)
        .or('shipping_status.is.null,shipping_status.eq.pending')
    }
    
    // Filter: preparing
    // shipping_status = preparing
    else if (filter === 'preparing') {
      query = query.eq('shipping_status', 'preparing')
    }
    
    // Filter: shipped
    // shipping_status = shipped
    else if (filter === 'shipped') {
      query = query.eq('shipping_status', 'shipped')
    }
    
    // Filter: delivered
    // shipping_status = delivered
    else if (filter === 'delivered') {
      query = query.eq('shipping_status', 'delivered')
    }
    
    // Filter: all → no filter

    // ========================================
    // 5. APPLY SEARCH
    // ========================================
    if (search && search.trim().length > 0) {
      const searchTerm = search.trim()
      
      // Search by customer_name, customer_email, tracking_number, or order id
      query = query.or(`
        customer_name.ilike.%${searchTerm}%,
        customer_email.ilike.%${searchTerm}%,
        tracking_number.eq.${searchTerm},
        id.ilike.%${searchTerm}%
      `)
    }

    // ========================================
    // 6. ORDER + PAGINATION
    // ========================================
    
    // Order by created_at DESC (most recent first)
    // Exception: pending_* tabs should show oldest first (FIFO)
    if (filter === 'pending_address' || filter === 'pending_shipment') {
      query = query.order('created_at', { ascending: true })
    } else {
      query = query.order('created_at', { ascending: false })
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // ========================================
    // 7. EXECUTE QUERY
    // ========================================
    const { data: orders, error, count } = await query

    if (error) {
      console.error('[GET /api/admin/envios] Query error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch orders' 
      }, { status: 500 })
    }

    // ========================================
    // 8. CALCULATE STATS
    // ========================================
    
    // Stats query (no pagination)
    const { data: allOrders } = await supabaseAdmin
      .from('orders')
      .select('id, payment_status, shipping_status, shipping_address')
    
    const stats = {
      total: allOrders?.length || 0,
      pending_address: allOrders?.filter(o => 
        o.payment_status === 'paid' && !o.shipping_address
      ).length || 0,
      pending_shipment: allOrders?.filter(o => 
        o.payment_status === 'paid' && 
        o.shipping_address && 
        (!o.shipping_status || o.shipping_status === 'pending')
      ).length || 0,
      preparing: allOrders?.filter(o => 
        o.shipping_status === 'preparing'
      ).length || 0,
      shipped: allOrders?.filter(o => 
        o.shipping_status === 'shipped'
      ).length || 0,
      delivered: allOrders?.filter(o => 
        o.shipping_status === 'delivered'
      ).length || 0
    }

    // ========================================
    // 9. FORMAT RESPONSE
    // ========================================
    
    // Count total matching records (for pagination)
    const total = count || orders?.length || 0

    return NextResponse.json({
      orders: orders || [],
      stats,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    })

  } catch (error: any) {
    console.error('[GET /api/admin/envios] Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
