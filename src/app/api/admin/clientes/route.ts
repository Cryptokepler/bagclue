import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Cliente, ClientesListResponse } from '@/types/admin-clientes'

/**
 * GET /api/admin/clientes
 * 
 * Retorna lista paginada de clientes con filtros
 * Query params:
 * - search: búsqueda por nombre/email/teléfono
 * - status: filtro de estado
 * - orderBy: ordenamiento
 * - page: número de página (default 1)
 * - limit: resultados por página (default 25)
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const orderBy = searchParams.get('orderBy') || 'recent'
    const showArchived = searchParams.get('showArchived') === 'true'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '25', 10)
    const offset = (page - 1) * limit

    // Fetch all orders con customer data
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('user_id, customer_email, customer_name, customer_phone, total, status, payment_status, shipping_status, shipping_address, created_at')

    if (ordersError) {
      console.error('[CLIENTES LIST] Orders error:', ordersError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Fetch all layaways
    const { data: layaways, error: layawaysError } = await supabaseAdmin
      .from('layaways')
      .select('user_id, customer_email, customer_name, customer_phone, status, amount_remaining, created_at')

    if (layawaysError) {
      console.error('[CLIENTES LIST] Layaways error:', layawaysError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Fetch payment reviews
    const { data: paymentReviews, error: paymentReviewsError } = await supabaseAdmin
      .from('payment_transactions')
      .select('order_id, layaway_id')
      .eq('status', 'proof_uploaded')

    if (paymentReviewsError) {
      console.error('[CLIENTES LIST] Payment reviews error:', paymentReviewsError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Create payment review map for quick lookup
    const paymentReviewMap = new Map<string, number>()
    paymentReviews?.forEach(pr => {
      if (pr.order_id) {
        paymentReviewMap.set(pr.order_id, (paymentReviewMap.get(pr.order_id) || 0) + 1)
      }
      if (pr.layaway_id) {
        paymentReviewMap.set(pr.layaway_id, (paymentReviewMap.get(pr.layaway_id) || 0) + 1)
      }
    })

    // Fetch customer profiles
    let profilesQuery = supabaseAdmin
      .from('customer_profiles')
      .select('user_id, email, name, phone, created_at, archived_at')

    // Filtrar archivados por defecto (salvo si showArchived = true)
    if (!showArchived) {
      profilesQuery = profilesQuery.is('archived_at', null)
    }

    const { data: profiles, error: profilesError } = await profilesQuery

    if (profilesError) {
      console.error('[CLIENTES LIST] Profiles error:', profilesError)
    }

    // Build client map
    const clientMap = new Map<string, Cliente>()

    // Process orders
    orders?.forEach(order => {
      const email = order.customer_email.toLowerCase()
      const clientId = order.user_id || email

      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          id: clientId,
          type: order.user_id ? 'registered' : 'guest',
          email: order.customer_email,
          name: order.customer_name,
          phone: order.customer_phone,
          user_id: order.user_id,
          total_orders: 0,
          total_spent: 0,
          total_layaways: 0,
          active_layaways: 0,
          pending_payments: 0,
          balance_due: 0,
          last_purchase_at: null,
          customer_status: 'new',
          has_pending_address: false,
          has_payment_review: false,
          has_active_layaway: false,
          registered_at: null
        })
      }

      const client = clientMap.get(clientId)!
      client.total_orders++
      if (order.status === 'confirmed') {
        client.total_spent += Number(order.total)
      }
      if (order.status === 'pending' && order.payment_status === 'pending') {
        client.pending_payments++
      }
      if (order.shipping_status === 'pending' && (!order.shipping_address || order.shipping_address === '')) {
        client.has_pending_address = true
      }
      if (paymentReviewMap.has(order.user_id || order.customer_email)) {
        client.has_payment_review = true
      }
      if (!client.last_purchase_at || order.created_at > client.last_purchase_at) {
        client.last_purchase_at = order.created_at
      }
    })

    // Process layaways
    layaways?.forEach(layaway => {
      const email = layaway.customer_email.toLowerCase()
      const clientId = layaway.user_id || email

      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          id: clientId,
          type: layaway.user_id ? 'registered' : 'guest',
          email: layaway.customer_email,
          name: layaway.customer_name,
          phone: layaway.customer_phone,
          user_id: layaway.user_id,
          total_orders: 0,
          total_spent: 0,
          total_layaways: 0,
          active_layaways: 0,
          pending_payments: 0,
          balance_due: 0,
          last_purchase_at: layaway.created_at,
          customer_status: 'new',
          has_pending_address: false,
          has_payment_review: false,
          has_active_layaway: false,
          registered_at: null
        })
      }

      const client = clientMap.get(clientId)!
      client.total_layaways++
      if (layaway.status === 'active') {
        client.active_layaways++
        client.has_active_layaway = true
        client.balance_due += Number(layaway.amount_remaining)
      }
    })

    // Add registered_at and archived_at from profiles
    profiles?.forEach(profile => {
      const client = clientMap.get(profile.user_id)
      if (client) {
        client.registered_at = profile.created_at
        client.archived_at = profile.archived_at
        // Update name/phone if missing from orders/layaways
        if (!client.name) client.name = profile.name
        if (!client.phone) client.phone = profile.phone
      }
    })

    // Calculate customer_status
    clientMap.forEach(client => {
      if (client.total_orders > 1) {
        client.customer_status = 'recurring'
      } else if (client.last_purchase_at) {
        const daysSinceLastPurchase = (Date.now() - new Date(client.last_purchase_at).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceLastPurchase <= 30) {
          client.customer_status = 'active'
        } else if (daysSinceLastPurchase <= 90) {
          client.customer_status = 'inactive'
        } else {
          client.customer_status = 'new'
        }
      }
    })

    // Convert to array and filtrar archivados si showArchived = false
    let clientes = Array.from(clientMap.values())
    if (!showArchived) {
      clientes = clientes.filter(c => !c.archived_at)
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      clientes = clientes.filter(c => 
        c.name?.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.phone?.includes(searchLower)
      )
    }

    // Apply status filter
    if (status !== 'all') {
      switch (status) {
        case 'pending_payments':
          clientes = clientes.filter(c => c.pending_payments > 0 || c.active_layaways > 0)
          break
        case 'payment_review':
          clientes = clientes.filter(c => c.has_payment_review)
          break
        case 'confirmed_purchases':
          clientes = clientes.filter(c => c.total_orders > 0)
          break
        case 'pending_address':
          clientes = clientes.filter(c => c.has_pending_address)
          break
        case 'recurring':
          clientes = clientes.filter(c => c.customer_status === 'recurring')
          break
      }
    }

    // Apply ordering
    switch (orderBy) {
      case 'recent':
        clientes.sort((a, b) => {
          if (!a.last_purchase_at) return 1
          if (!b.last_purchase_at) return -1
          return new Date(b.last_purchase_at).getTime() - new Date(a.last_purchase_at).getTime()
        })
        break
      case 'total_spent':
        clientes.sort((a, b) => b.total_spent - a.total_spent)
        break
      case 'balance_due':
        clientes.sort((a, b) => b.balance_due - a.balance_due)
        break
      case 'last_purchase':
        clientes.sort((a, b) => {
          if (!a.last_purchase_at) return 1
          if (!b.last_purchase_at) return -1
          return new Date(b.last_purchase_at).getTime() - new Date(a.last_purchase_at).getTime()
        })
        break
    }

    // Pagination
    const total = clientes.length
    const totalPages = Math.ceil(total / limit)
    const paginatedClientes = clientes.slice(offset, offset + limit)

    const response: ClientesListResponse = {
      clientes: paginatedClientes,
      total,
      page,
      limit,
      totalPages
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('[CLIENTES LIST] Error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
