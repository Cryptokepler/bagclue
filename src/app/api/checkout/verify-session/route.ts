import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    console.log('[VERIFY] 1. Request recibido:', {
      sessionId,
      timestamp: new Date().toISOString()
    })

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 })
    }

    // 1. Consultar Stripe
    console.log('[VERIFY] 2. Consultando Stripe...')
    let session: Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId)
      console.log('[VERIFY] 3. Sesión encontrada en Stripe:', {
        id: session.id,
        payment_status: session.payment_status,
        status: session.status,
        payment_intent: session.payment_intent,
        metadata: session.metadata
      })
    } catch (err: any) {
      console.error('[VERIFY] ERROR: Sesión no encontrada en Stripe:', err.message)
      return NextResponse.json({ 
        error: 'Session not found in Stripe',
        details: err.message
      }, { status: 404 })
    }

    // 2. Verificar payment_status
    if (session.payment_status !== 'paid') {
      console.log('[VERIFY] WARNING: Pago no completado:', session.payment_status)
      return NextResponse.json({ 
        success: false,
        message: 'Payment not completed',
        payment_status: session.payment_status
      })
    }

    // 3. Leer metadata.order_id
    const order_id = session.metadata?.order_id
    if (!order_id) {
      console.error('[VERIFY] ERROR: No order_id in metadata')
      return NextResponse.json({ 
        error: 'No order_id in session metadata' 
      }, { status: 400 })
    }

    console.log('[VERIFY] 4. order_id encontrado:', order_id)

    // 4. Buscar orden en Supabase
    const { data: existingOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, status, payment_status, stripe_payment_intent_id')
      .eq('id', order_id)
      .single()

    console.log('[VERIFY] 5. Orden en Supabase:', {
      found: !fetchError,
      order: existingOrder || null,
      error: fetchError?.message || null
    })

    if (fetchError) {
      console.error('[VERIFY] ERROR: Orden no encontrada en Supabase')
      return NextResponse.json({ 
        error: 'Order not found',
        order_id 
      }, { status: 404 })
    }

    // 5. Idempotencia: Si ya está paid, no hacer nada
    if (existingOrder.payment_status === 'paid') {
      console.log('[VERIFY] 6. Orden ya marcada como paid (idempotente)')
      return NextResponse.json({ 
        success: true,
        message: 'Order already paid',
        order_id,
        payment_status: 'paid',
        idempotent: true
      })
    }

    // 6. Actualizar orden
    console.log('[VERIFY] 7. Actualizando orden a paid/confirmed...')
    const { data: updatedOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string || null
      })
      .eq('id', order_id)
      .select()
      .single()

    console.log('[VERIFY] 8. Resultado actualizar orden:', {
      success: !orderError,
      error: orderError?.message || null
    })

    if (orderError) {
      console.error('[VERIFY] ERROR updating order:', orderError)
      return NextResponse.json({ 
        error: 'Failed to update order',
        details: orderError.message
      }, { status: 500 })
    }

    // 7. Obtener items de la orden
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('product_id')
      .eq('order_id', order_id)

    if (itemsError || !items) {
      console.error('[VERIFY] ERROR fetching order items:', itemsError)
      return NextResponse.json({ 
        error: 'Failed to fetch order items',
        details: itemsError?.message
      }, { status: 500 })
    }

    console.log('[VERIFY] 9. Items encontrados:', items.length)

    // 8. Actualizar productos
    for (const item of items) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('id, stock, status')
        .eq('id', item.product_id)
        .single()

      console.log(`[VERIFY] 10a. Product BEFORE update:`, {
        productId: item.product_id,
        currentStock: product?.stock,
        currentStatus: product?.status
      })

      if (product && product.stock === 1) {
        // Marcar como sold
        const { error: updateError } = await supabaseAdmin
          .from('products')
          .update({ status: 'sold', stock: 0 })
          .eq('id', item.product_id)

        console.log('[VERIFY] 10b. Resultado actualizar product (sold):', {
          success: !updateError,
          productId: item.product_id,
          error: updateError?.message || null
        })
      } else if (product) {
        // Decrementar stock
        const newStock = (product.stock || 1) - 1
        const { error: updateError } = await supabaseAdmin
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id)

        console.log('[VERIFY] 10c. Resultado actualizar product (decrementar):', {
          success: !updateError,
          productId: item.product_id,
          newStock,
          error: updateError?.message || null
        })
      }
    }

    console.log('[VERIFY] SUCCESS: Orden verificada y actualizada')

    return NextResponse.json({
      success: true,
      message: 'Order verified and updated successfully',
      order_id,
      payment_status: 'paid',
      status: 'confirmed',
      products_updated: items.length
    })

  } catch (error: any) {
    console.error('[VERIFY] ERROR GLOBAL:', {
      message: error.message,
      stack: error.stack
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
