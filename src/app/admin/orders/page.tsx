import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'
import AdminNav from '@/components/admin/AdminNav'
import VentasFilters from '@/components/admin/VentasFilters'
import VentasTabs from '@/components/admin/VentasTabs'
import VentasMetrics from '@/components/admin/VentasMetrics'
import VentasTableCash from '@/components/admin/VentasTableCash'
import VentasTableLayaway from '@/components/admin/VentasTableLayaway'

type SearchParams = {
  type?: 'all' | 'cash' | 'layaway'
  date?: 'today' | 'yesterday' | 'week' | 'month'
  payment_status?: 'paid' | 'pending' | 'under_review'
  shipping_status?: 'pending_address' | 'pending_shipment' | 'preparing' | 'shipped' | 'delivered'
  sort?: 'newest' | 'oldest' | 'highest' | 'lowest' | 'least_pending' | 'most_pending' | 'next_payment'
  search?: string
}

async function getDateRange(dateFilter?: string) {
  const now = new Date()
  let startDate: Date | null = null
  
  if (dateFilter === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (dateFilter === 'yesterday') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
  } else if (dateFilter === 'week') {
    // This week (desde el domingo)
    const dayOfWeek = now.getDay()
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
  } else if (dateFilter === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }
  
  return startDate ? { startDate: startDate.toISOString() } : null
}

async function getOrders(params: SearchParams) {
  let query = supabaseAdmin
    .from('orders')
    .select('id, created_at, customer_name, customer_email, user_id, total, payment_status, payment_method, shipping_status, status, order_items(*, products(title, brand))')
  
  // Date filter
  const dateRange = await getDateRange(params.date)
  if (dateRange) {
    query = query.gte('created_at', dateRange.startDate)
    if ('endDate' in dateRange) {
      query = query.lt('created_at', dateRange.endDate)
    }
  }
  
  // Payment status filter
  if (params.payment_status) {
    query = query.eq('payment_status', params.payment_status)
  }
  
  // Shipping status filter
  if (params.shipping_status) {
    query = query.eq('shipping_status', params.shipping_status)
  }
  
  // Search filter
  if (params.search) {
    query = query.or(`customer_name.ilike.%${params.search}%,customer_email.ilike.%${params.search}%`)
  }
  
  // Sorting
  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: 'created_at', ascending: false },
    oldest: { column: 'created_at', ascending: true },
    highest: { column: 'total', ascending: false },
    lowest: { column: 'total', ascending: true }
  }
  
  const sortConfig = sortMap[params.sort || 'newest'] || sortMap.newest
  query = query.order(sortConfig.column, { ascending: sortConfig.ascending })

  const { data: orders, error } = await query

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  return orders || []
}

async function getLayaways(params: SearchParams) {
  let query = supabaseAdmin
    .from('layaways')
    .select(`
      id,
      customer_name,
      customer_email,
      user_id,
      product_title,
      product_brand,
      total_amount,
      amount_paid,
      amount_remaining,
      payments_completed,
      payments_remaining,
      next_payment_due_date,
      next_payment_amount,
      status,
      created_at,
      plan_type
    `)
  
  // Date filter
  const dateRange = await getDateRange(params.date)
  if (dateRange) {
    query = query.gte('created_at', dateRange.startDate)
    if ('endDate' in dateRange) {
      query = query.lt('created_at', dateRange.endDate)
    }
  }
  
  // Search filter
  if (params.search) {
    query = query.or(`customer_name.ilike.%${params.search}%,customer_email.ilike.%${params.search}%`)
  }
  
  // Sorting for layaways
  if (params.sort === 'newest') {
    query = query.order('created_at', { ascending: false })
  } else if (params.sort === 'oldest') {
    query = query.order('created_at', { ascending: true })
  } else if (params.sort === 'highest') {
    query = query.order('total_amount', { ascending: false })
  } else if (params.sort === 'lowest') {
    query = query.order('total_amount', { ascending: true })
  } else if (params.sort === 'least_pending') {
    query = query.order('amount_remaining', { ascending: true })
  } else if (params.sort === 'most_pending') {
    query = query.order('amount_remaining', { ascending: false })
  } else if (params.sort === 'next_payment') {
    query = query.order('next_payment_due_date', { ascending: true, nullsFirst: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: layaways, error } = await query

  if (error) {
    console.error('Error fetching layaways:', error)
    return []
  }

  return layaways || []
}

async function getMetrics(orders: any[], layaways: any[]) {
  // Total ventas
  const totalVentas = orders.length + layaways.length
  
  // Ventas contado
  const ventasContado = orders.length
  
  // Ventas a pagos
  const ventasAPagos = layaways.length
  
  // Pagadas (orders paid + layaways completed)
  const ordersPaid = orders.filter(o => o.payment_status === 'paid').length
  const layawaysCompleted = layaways.filter(l => l.status === 'completed').length
  const pagadas = ordersPaid + layawaysCompleted
  
  // Pendientes (orders pending + layaways active/pending_first_payment/overdue)
  const ordersPending = orders.filter(o => o.payment_status === 'pending').length
  const layawaysPending = layaways.filter(l => 
    ['pending_first_payment', 'active', 'overdue'].includes(l.status)
  ).length
  const pendientes = ordersPending + layawaysPending
  
  // Ingresos confirmados (orders paid + layaways amount_paid)
  const ingresosOrders = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + (o.total || 0), 0)
  const ingresosLayaways = layaways
    .reduce((sum, l) => sum + (parseFloat(l.amount_paid || '0')), 0)
  const ingresosConfirmados = ingresosOrders + ingresosLayaways
  
  // Saldo pendiente total (layaways amount_remaining active only)
  const saldoPendiente = layaways
    .filter(l => ['pending_first_payment', 'active', 'overdue'].includes(l.status))
    .reduce((sum, l) => sum + (parseFloat(l.amount_remaining || '0')), 0)
  
  // Próximos pagos (layaways with next_payment_due_date in future, active only)
  const now = new Date()
  const proximosPagos = layaways.filter(l => 
    ['active', 'overdue'].includes(l.status) &&
    l.next_payment_due_date &&
    new Date(l.next_payment_due_date) >= now
  ).length
  
  return {
    totalVentas,
    ventasContado,
    ventasAPagos,
    pagadas,
    pendientes,
    ingresosConfirmados,
    saldoPendiente,
    proximosPagos
  }
}

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
    redirect('/admin/login')
  }

  const params = await searchParams
  const currentType = params.type || 'all'

  // Fetch data
  const orders = await getOrders(params)
  const layaways = await getLayaways(params)
  const metrics = await getMetrics(orders, layaways)

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminNav />

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Ventas</h1>
          <p className="text-gray-400 text-sm">
            Gestiona ventas contado y apartados
          </p>
        </div>

        {/* Tabs */}
        <VentasTabs currentType={currentType} />

        {/* Filters */}
        <VentasFilters 
          currentParams={params}
        />

        {/* Metrics */}
        <VentasMetrics metrics={metrics} />

        {/* Tables */}
        {(currentType === 'all' || currentType === 'cash') && (
          <VentasTableCash 
            orders={orders}
            showHeader={currentType === 'cash'}
          />
        )}

        {(currentType === 'all' || currentType === 'layaway') && (
          <VentasTableLayaway 
            layaways={layaways}
            showHeader={currentType === 'layaway'}
          />
        )}
      </main>
    </div>
  )
}
