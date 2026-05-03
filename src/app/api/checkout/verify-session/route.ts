import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    console.log('[VERIFY] Request:', sessionId?.slice(0, 20) + '...')

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 })
    }

    // 1. Consultar Stripe
    let session: Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId)
    } catch (err: any) {
      console.error('[VERIFY] Stripe error:', err.message)
      return NextResponse.json({ 
        error: 'Session not found in Stripe',
        details: err.message
      }, { status: 404 })
    }

    // 2. Verificar payment_status
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ 
        success: false,
        message: 'Payment not completed',
        payment_status: session.payment_status
      })
    }

    // 3. Leer metadata.order_id
    const order_id = session.metadata?.order_id
    if (!order_id) {
      console.error('[VERIFY] No order_id in metadata')
      return NextResponse.json({ 
        error: 'No order_id in session metadata' 
      }, { status: 400 })
    }

    // 4. Buscar orden (early return si ya paid)
    const { data: existingOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, payment_status')
      .eq('id', order_id)
      .single()

    if (fetchError) {
      console.error('[VERIFY] Order not found')
      return NextResponse.json({ 
        error: 'Order not found',
        order_id 
      }, { status: 404 })
    }

    // 5. IDEMPOTENCIA (fast path)
    if (existingOrder.payment_status === 'paid') {
      const elapsed = Date.now() - startTime
      console.log(`[VERIFY] ✅ Already paid (${elapsed}ms)`)
      return NextResponse.json({ 
        success: true,
        message: 'Order already paid',
        order_id,
        payment_status: 'paid',
        idempotent: true
      })
    }

    // 6. Actualizar orden
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string || null
      })
      .eq('id', order_id)

    if (orderError) {
      console.error('[VERIFY] Update order failed:', orderError.message)
      return NextResponse.json({ 
        error: 'Failed to update order',
        details: orderError.message
      }, { status: 500 })
    }

    // 7. Obtener items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('product_id')
      .eq('order_id', order_id)

    if (itemsError || !items) {
      console.error('[VERIFY] Fetch items failed:', itemsError?.message)
      return NextResponse.json({ 
        error: 'Failed to fetch order items',
        details: itemsError?.message
      }, { status: 500 })
    }

    // 8. Actualizar productos EN PARALELO (más rápido)
    await Promise.all(items.map(async (item) => {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('id, stock')
        .eq('id', item.product_id)
        .single()

      if (product && product.stock === 1) {
        await supabaseAdmin
          .from('products')
          .update({ status: 'sold', stock: 0 })
          .eq('id', item.product_id)
      } else if (product) {
        await supabaseAdmin
          .from('products')
          .update({ stock: (product.stock || 1) - 1 })
          .eq('id', item.product_id)
      }
    }))

    const elapsed = Date.now() - startTime
    console.log(`[VERIFY] ✅ Success (${elapsed}ms) - order ${order_id.slice(0, 8)}`)

    return NextResponse.json({
      success: true,
      message: 'Order verified and updated successfully',
      order_id,
      payment_status: 'paid',
      status: 'confirmed',
      products_updated: items.length
    })

  } catch (error: any) {
    const elapsed = Date.now() - startTime
    console.error(`[VERIFY] ❌ Error (${elapsed}ms):`, error.message)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
