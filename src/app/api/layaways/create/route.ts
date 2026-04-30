import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, customer_name, customer_email, customer_phone } = body

    if (!product_id || !customer_name || !customer_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Get product and validate
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, title, brand, price, currency, status, allow_layaway, layaway_deposit_percent')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.status !== 'available') {
      return NextResponse.json({ error: 'Product is not available for layaway' }, { status: 400 })
    }

    if (!product.allow_layaway) {
      return NextResponse.json({ error: 'This product does not allow layaway' }, { status: 400 })
    }

    if (!product.price || product.price <= 0) {
      return NextResponse.json({ error: 'Product has no valid price' }, { status: 400 })
    }

    // 2. Calculate amounts
    const depositPercent = product.layaway_deposit_percent || 20.00
    const productPrice = product.price
    const depositAmount = Math.round(productPrice * (depositPercent / 100))
    const balanceAmount = productPrice - depositAmount

    // 3. Create layaway record (status: pending)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 15) // 15 días

    const { data: layaway, error: layawayError } = await supabaseAdmin
      .from('layaways')
      .insert({
        product_id,
        customer_name,
        customer_email,
        customer_phone,
        product_price: productPrice,
        deposit_percent: depositPercent,
        deposit_amount: depositAmount,
        balance_amount: balanceAmount,
        currency: product.currency || 'MXN',
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (layawayError || !layaway) {
      console.error('[LAYAWAY CREATE] Error creating layaway:', layawayError)
      return NextResponse.json({ error: 'Failed to create layaway' }, { status: 500 })
    }

    // 4. Create Stripe Checkout Session for deposit
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bagclue.vercel.app'
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: product.currency?.toLowerCase() || 'mxn',
            product_data: {
              name: `Apartado: ${product.brand} ${product.title}`,
              description: `Depósito inicial (${depositPercent}%)`,
              images: []
            },
            unit_amount: depositAmount * 100 // Stripe usa centavos
          },
          quantity: 1
        }
      ],
      customer_email: customer_email,
      metadata: {
        type: 'layaway_deposit',
        layaway_id: layaway.id,
        product_id: product.id
      },
      success_url: `${baseUrl}/layaway/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/catalogo/${product.id}?layaway_cancelled=true`
    })

    // 5. Update layaway with session ID
    await supabaseAdmin
      .from('layaways')
      .update({ deposit_session_id: session.id })
      .eq('id', layaway.id)

    return NextResponse.json({
      layaway_id: layaway.id,
      layaway_token: layaway.layaway_token,
      checkout_url: session.url,
      deposit_amount: depositAmount,
      balance_amount: balanceAmount,
      deposit_percent: depositPercent,
      expires_at: expiresAt.toISOString()
    })

  } catch (error: any) {
    console.error('[LAYAWAY CREATE] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
