import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia'
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: layawayId } = await params

    // Get layaway
    const { data: layaway, error } = await supabaseAdmin
      .from('layaways')
      .select(`
        id,
        product_id,
        customer_email,
        customer_name,
        balance_amount,
        currency,
        status,
        expires_at,
        layaway_token
      `)
      .eq('id', layawayId)
      .single()

    if (error || !layaway) {
      return NextResponse.json({ error: 'Layaway not found' }, { status: 404 })
    }

    // Validate status
    if (layaway.status !== 'active') {
      return NextResponse.json({ 
        error: `Cannot pay balance. Layaway status is: ${layaway.status}` 
      }, { status: 400 })
    }

    // Check if expired
    const now = new Date()
    const expires = new Date(layaway.expires_at)
    if (now > expires) {
      return NextResponse.json({ 
        error: 'Layaway has expired. Please contact us.' 
      }, { status: 400 })
    }

    // Get product info for session
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, title, brand')
      .eq('id', layaway.product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Create Stripe Checkout Session for balance
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bagclue.vercel.app'
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: layaway.currency?.toLowerCase() || 'mxn',
            product_data: {
              name: `Saldo final: ${product.brand} ${product.title}`,
              description: `Pago restante del apartado`,
              images: []
            },
            unit_amount: layaway.balance_amount * 100 // Stripe usa centavos
          },
          quantity: 1
        }
      ],
      customer_email: layaway.customer_email,
      metadata: {
        type: 'layaway_balance',
        layaway_id: layaway.id,
        product_id: product.id
      },
      success_url: `${baseUrl}/layaway/${layaway.layaway_token}?balance_paid=true`,
      cancel_url: `${baseUrl}/layaway/${layaway.layaway_token}`
    })

    // Update layaway with balance session ID
    await supabaseAdmin
      .from('layaways')
      .update({ balance_session_id: session.id })
      .eq('id', layaway.id)

    return NextResponse.json({
      checkout_url: session.url
    })

  } catch (error: any) {
    console.error('[PAY BALANCE] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
