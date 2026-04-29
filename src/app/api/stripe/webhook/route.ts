import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    // LOG 1: Request recibido
    console.log('[WEBHOOK] 1. Request recibido en /api/stripe/webhook', {
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method
    })

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    // LOG 2: Stripe-signature presente sí/no
    console.log('[WEBHOOK] 2. stripe-signature presente:', {
      hasSignature: !!signature,
      signatureLength: signature?.length || 0
    })

    if (!signature) {
      console.error('[WEBHOOK] ERROR: No signature header present')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // LOG 3: Resultado de stripe.webhooks.constructEvent
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('[WEBHOOK] 3. constructEvent SUCCESS:', {
        eventId: event.id,
        created: event.created
      })
    } catch (err: any) {
      console.error('[WEBHOOK] 3. constructEvent FAILED:', {
        error: err.message,
        stack: err.stack
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // LOG 4: event.type recibido
    console.log('[WEBHOOK] 4. event.type recibido:', event.type)

    // Manejar eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // LOG 5, 6, 7: session.id, metadata.order_id, payment_intent
        console.log('[WEBHOOK] 5. session.id:', session.id)
        console.log('[WEBHOOK] 6. session.metadata.order_id:', session.metadata?.order_id || 'MISSING')
        console.log('[WEBHOOK] 7. payment_intent:', session.payment_intent || 'MISSING')
        
        await handleCheckoutCompleted(session)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // LOG 5, 6: session.id, metadata.order_id
        console.log('[WEBHOOK] 5. session.id:', session.id)
        console.log('[WEBHOOK] 6. session.metadata.order_id:', session.metadata?.order_id || 'MISSING')
        
        await handleCheckoutExpired(session)
        break
      }

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    // LOG 11: Cualquier error con stack trace completo
    console.error('[WEBHOOK] 11. ERROR GLOBAL:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const order_id = session.metadata?.order_id

  if (!order_id) {
    console.error('[WEBHOOK] ERROR: No order_id in session metadata')
    return
  }

  console.log(`[WEBHOOK] Processing completed checkout for order: ${order_id}`)

  // LOG 8: Resultado de buscar la orden en Supabase
  const { data: existingOrder, error: fetchError } = await supabaseAdmin
    .from('orders')
    .select('id, status, payment_status')
    .eq('id', order_id)
    .single()

  console.log('[WEBHOOK] 8. Resultado buscar orden en Supabase:', {
    success: !fetchError,
    order: existingOrder || null,
    error: fetchError?.message || null
  })

  if (fetchError) {
    console.error('[WEBHOOK] ERROR: No se pudo buscar la orden', fetchError)
    return
  }

  // LOG 9: Resultado de actualizar orders
  const { data: updatedOrder, error: orderError } = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'confirmed',
      stripe_payment_intent_id: session.payment_intent as string || null
    })
    .eq('id', order_id)
    .select()
    .single()

  console.log('[WEBHOOK] 9. Resultado actualizar orders:', {
    success: !orderError,
    orderId: order_id,
    updatedFields: {
      payment_status: 'paid',
      status: 'confirmed',
      stripe_payment_intent_id: session.payment_intent
    },
    error: orderError?.message || null,
    errorDetails: orderError || null
  })

  if (orderError) {
    console.error('[WEBHOOK] ERROR updating order:', orderError)
    return
  }

  // Obtener items de la orden
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('product_id')
    .eq('order_id', order_id)

  if (itemsError || !items) {
    console.error('[WEBHOOK] ERROR fetching order items:', itemsError)
    return
  }

  console.log(`[WEBHOOK] Found ${items.length} items to update`)

  // LOG 10: Resultado de actualizar products
  for (const item of items) {
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id, stock, status')
      .eq('id', item.product_id)
      .single()

    console.log(`[WEBHOOK] 10a. Product BEFORE update:`, {
      productId: item.product_id,
      currentStock: product?.stock,
      currentStatus: product?.status
    })

    if (product && product.stock === 1) {
      // Si stock = 1, marcar como sold
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('products')
        .update({ status: 'sold', stock: 0 })
        .eq('id', item.product_id)
        .select()
        .single()

      console.log('[WEBHOOK] 10b. Resultado actualizar product (sold):', {
        success: !updateError,
        productId: item.product_id,
        updatedFields: { status: 'sold', stock: 0 },
        error: updateError?.message || null,
        errorDetails: updateError || null
      })
    } else {
      // Decrementar stock (para productos con stock > 1 en el futuro)
      const newStock = (product?.stock || 1) - 1
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product_id)
        .select()
        .single()

      console.log('[WEBHOOK] 10c. Resultado actualizar product (decrementar stock):', {
        success: !updateError,
        productId: item.product_id,
        updatedFields: { stock: newStock },
        error: updateError?.message || null,
        errorDetails: updateError || null
      })
    }
  }

  console.log(`[WEBHOOK] SUCCESS: Order ${order_id} marked as paid and products marked as sold`)
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const order_id = session.metadata?.order_id

  if (!order_id) {
    console.error('[WEBHOOK] ERROR: No order_id in session metadata (expired)')
    return
  }

  console.log(`[WEBHOOK] Processing expired checkout for order: ${order_id}`)

  // Cancelar orden
  const { data: updatedOrder, error: orderError } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'cancelled',
      payment_status: 'failed'
    })
    .eq('id', order_id)
    .select()
    .single()

  console.log('[WEBHOOK] Resultado cancelar orden (expired):', {
    success: !orderError,
    orderId: order_id,
    error: orderError?.message || null
  })

  if (orderError) {
    console.error('[WEBHOOK] ERROR cancelling order:', orderError)
    return
  }

  // Obtener items de la orden
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('product_id')
    .eq('order_id', order_id)

  if (itemsError || !items) {
    console.error('[WEBHOOK] ERROR fetching order items (expired):', itemsError)
    return
  }

  // Liberar productos (volver a available)
  for (const item of items) {
    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({ status: 'available' })
      .eq('id', item.product_id)

    console.log('[WEBHOOK] Resultado liberar producto (expired):', {
      success: !updateError,
      productId: item.product_id,
      updatedStatus: 'available',
      error: updateError?.message || null
    })
  }

  console.log(`[WEBHOOK] SUCCESS: Order ${order_id} cancelled and products released`)
}
