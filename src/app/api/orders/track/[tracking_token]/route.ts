import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tracking_token: string }> }
) {
  try {
    const { tracking_token } = await params

    // Validar formato del token
    if (!/^[a-f0-9]{32}$/.test(tracking_token)) {
      return NextResponse.json({ error: 'Invalid tracking token format' }, { status: 400 })
    }

    // Buscar orden por tracking_token
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        created_at,
        customer_name,
        customer_email,
        customer_phone,
        total,
        status,
        payment_status,
        shipping_address,
        shipping_provider,
        shipping_status,
        tracking_number,
        tracking_url,
        shipped_at,
        delivered_at,
        notes
      `)
      .eq('tracking_token', tracking_token)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Buscar items de la orden
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select(`
        quantity,
        unit_price,
        product_id
      `)
      .eq('order_id', order.id)

    if (itemsError) {
      return NextResponse.json({ error: 'Failed to load order items' }, { status: 500 })
    }

    // Buscar información de productos
    const productIds = items.map(item => item.product_id)
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, title, brand, product_images(url)')
      .in('id', productIds)

    if (productsError) {
      return NextResponse.json({ error: 'Failed to load products' }, { status: 500 })
    }

    // Combinar items con productos
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.product_id)
      return {
        ...item,
        product_title: product?.title || 'Producto',
        product_brand: product?.brand || '',
        product_image: product?.product_images?.[0]?.url || ''
      }
    })

    return NextResponse.json({
      order: {
        id: order.id,
        created_at: order.created_at,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        total: order.total,
        status: order.status,
        payment_status: order.payment_status,
        shipping_address: order.shipping_address,
        shipping_provider: order.shipping_provider,
        shipping_status: order.shipping_status || 'pending',
        tracking_number: order.tracking_number,
        tracking_url: order.tracking_url,
        shipped_at: order.shipped_at,
        delivered_at: order.delivered_at
      },
      items: orderItems
    })

  } catch (error: any) {
    console.error('[TRACK API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
