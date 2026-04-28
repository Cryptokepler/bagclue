import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia'
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customer_email, customer_name } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 })
    }

    if (!customer_email || !customer_name) {
      return NextResponse.json({ error: 'Datos de cliente requeridos' }, { status: 400 })
    }

    // Validar productos y reservarlos
    const validatedItems = []
    let subtotal = 0

    for (const item of items) {
      const { data: product, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', item.product_id)
        .single()

      if (error || !product) {
        return NextResponse.json({ 
          error: `Producto ${item.product_id} no encontrado` 
        }, { status: 400 })
      }

      // Validaciones críticas
      if (!product.is_published) {
        return NextResponse.json({ 
          error: `Producto ${product.title} no está disponible` 
        }, { status: 400 })
      }

      if (product.status !== 'available') {
        return NextResponse.json({ 
          error: `Producto ${product.title} no está disponible (${product.status})` 
        }, { status: 400 })
      }

      if (product.stock <= 0) {
        return NextResponse.json({ 
          error: `Producto ${product.title} sin stock` 
        }, { status: 400 })
      }

      if (!product.price) {
        return NextResponse.json({ 
          error: `Producto ${product.title} no tiene precio definido` 
        }, { status: 400 })
      }

      // Marcar producto como reserved INMEDIATAMENTE
      const { error: updateError } = await supabaseAdmin
        .from('products')
        .update({ status: 'reserved' })
        .eq('id', product.id)

      if (updateError) {
        console.error('Error reserving product:', updateError)
        return NextResponse.json({ 
          error: `No se pudo reservar el producto ${product.title}` 
        }, { status: 500 })
      }

      validatedItems.push({
        product_id: product.id,
        quantity: 1, // Por ahora solo 1 unidad por producto
        unit_price: product.price,
        subtotal: product.price,
        product_snapshot: {
          title: product.title,
          brand: product.brand,
          model: product.model,
          color: product.color,
          slug: product.slug,
          price: product.price,
          currency: product.currency
        }
      })

      subtotal += product.price
    }

    // Crear orden en Supabase (status=pending, payment_status=pending)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name,
        customer_email,
        subtotal,
        shipping: 0, // Sin envío por ahora
        total: subtotal,
        status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Error creating order:', orderError)
      // Rollback: liberar productos reservados
      for (const item of validatedItems) {
        await supabaseAdmin
          .from('products')
          .update({ status: 'available' })
          .eq('id', item.product_id)
      }
      return NextResponse.json({ error: 'Error al crear orden' }, { status: 500 })
    }

    // Crear order_items
    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(validatedItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        product_snapshot: item.product_snapshot
      })))

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      return NextResponse.json({ error: 'Error al crear detalle de orden' }, { status: 500 })
    }

    // Crear Stripe Checkout Session
    const line_items = validatedItems.map(item => ({
      price_data: {
        currency: item.product_snapshot.currency.toLowerCase(),
        product_data: {
          name: `${item.product_snapshot.brand} ${item.product_snapshot.title}`,
          description: item.product_snapshot.model || undefined,
        },
        unit_amount: Math.round(item.unit_price * 100), // Stripe usa centavos
      },
      quantity: item.quantity,
    }))

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/cancel`,
      customer_email,
      metadata: {
        order_id: order.id
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutos
    })

    // Guardar session_id en orden
    await supabaseAdmin
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Create checkout session error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
