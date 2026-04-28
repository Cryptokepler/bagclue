import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Verificar firma de Stripe
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`Stripe webhook received: ${event.type}`)

    // Manejar eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutExpired(session)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const order_id = session.metadata?.order_id

  if (!order_id) {
    console.error('No order_id in session metadata')
    return
  }

  console.log(`Processing completed checkout for order: ${order_id}`)

  // Actualizar orden
  const { error: orderError } = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'confirmed',
      stripe_payment_intent_id: session.payment_intent as string || null
    })
    .eq('id', order_id)

  if (orderError) {
    console.error('Error updating order:', orderError)
    return
  }

  // Obtener items de la orden
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('product_id')
    .eq('order_id', order_id)

  if (itemsError || !items) {
    console.error('Error fetching order items:', itemsError)
    return
  }

  // Marcar productos como sold y decrementar stock
  for (const item of items) {
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .single()

    if (product && product.stock === 1) {
      // Si stock = 1, marcar como sold
      await supabaseAdmin
        .from('products')
        .update({ status: 'sold', stock: 0 })
        .eq('id', item.product_id)
    } else {
      // Decrementar stock (para productos con stock > 1 en el futuro)
      await supabaseAdmin
        .from('products')
        .update({ stock: (product?.stock || 1) - 1 })
        .eq('id', item.product_id)
    }
  }

  console.log(`Order ${order_id} marked as paid and products marked as sold`)
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const order_id = session.metadata?.order_id

  if (!order_id) {
    console.error('No order_id in session metadata')
    return
  }

  console.log(`Processing expired checkout for order: ${order_id}`)

  // Cancelar orden
  const { error: orderError } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'cancelled',
      payment_status: 'failed'
    })
    .eq('id', order_id)

  if (orderError) {
    console.error('Error cancelling order:', orderError)
    return
  }

  // Obtener items de la orden
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('product_id')
    .eq('order_id', order_id)

  if (itemsError || !items) {
    console.error('Error fetching order items:', itemsError)
    return
  }

  // Liberar productos (volver a available)
  for (const item of items) {
    await supabaseAdmin
      .from('products')
      .update({ status: 'available' })
      .eq('id', item.product_id)
  }

  console.log(`Order ${order_id} cancelled and products released`)
}
