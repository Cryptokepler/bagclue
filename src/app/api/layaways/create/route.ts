import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia'
})

// Helper functions for Hermès brand detection
function normalizeBrand(brand: string): string {
  return brand.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function isHermes(brand: string): boolean {
  const normalized = normalizeBrand(brand)
  return normalized === 'hermes'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      product_id, 
      customer_name, 
      customer_email, 
      customer_phone,
      plan_weeks,
      first_payment_amount
    } = body

    // Validar campos requeridos
    if (!product_id || !customer_name || !customer_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!plan_weeks || ![4, 8, 18].includes(plan_weeks)) {
      return NextResponse.json({ 
        error: 'Invalid plan_weeks. Must be 4, 8, or 18' 
      }, { status: 400 })
    }

    if (!first_payment_amount || first_payment_amount <= 0) {
      return NextResponse.json({ 
        error: 'Invalid first_payment_amount' 
      }, { status: 400 })
    }

    // 1. Get product and validate
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, title, brand, price, currency, status, is_published')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.status !== 'available') {
      return NextResponse.json({ 
        error: 'Product is not available for layaway' 
      }, { status: 400 })
    }

    if (!product.is_published) {
      return NextResponse.json({ 
        error: 'Product is not published' 
      }, { status: 400 })
    }

    if (!product.price || product.price <= 0) {
      return NextResponse.json({ 
        error: 'Product has no valid price' 
      }, { status: 400 })
    }

    // 2. Check Hermès brand rules
    const isHermesBrand = isHermes(product.brand || '')
    
    // Hermès does not allow 18-week plans
    if (isHermesBrand && plan_weeks === 18) {
      return NextResponse.json({ 
        error: 'El plan de 18 semanas no está disponible para piezas Hermès.' 
      }, { status: 400 })
    }

    // 3. Calculate plan pricing
    const price_cash = product.price
    const price_4_weeks = price_cash
    const price_8_weeks = Math.round(price_cash * 1.035)
    const price_18_weeks = Math.round(price_cash * 1.056)

    // Select plan price based on brand rules
    let selected_plan_price: number
    if (isHermesBrand) {
      // Hermès: no increment for 4 and 8 weeks
      switch(plan_weeks) {
        case 4:
        case 8:
          selected_plan_price = price_cash
          break
        default:
          return NextResponse.json({ 
            error: 'Invalid plan_weeks' 
          }, { status: 400 })
      }
    } else {
      // Other brands: normal increment
      switch(plan_weeks) {
        case 4:
          selected_plan_price = price_4_weeks
          break
        case 8:
          selected_plan_price = price_8_weeks
          break
        case 18:
          selected_plan_price = price_18_weeks
          break
        default:
          return NextResponse.json({ 
            error: 'Invalid plan_weeks' 
          }, { status: 400 })
      }
    }

    // 3. Validate first payment
    const STRIPE_MINIMUM_MXN = 10 // Stripe minimum ~$0.50 USD
    const minimum_first_payment_calculated = Math.ceil(selected_plan_price / plan_weeks)
    const minimum_first_payment = Math.max(minimum_first_payment_calculated, STRIPE_MINIMUM_MXN)
    
    if (first_payment_amount < minimum_first_payment) {
      return NextResponse.json({
        error: `El pago inicial mínimo para apartar debe ser de al menos $${minimum_first_payment} ${product.currency}. Elige un pago inicial mayor.`,
        minimum_first_payment
      }, { status: 400 })
    }

    // Cap first payment at total (allow full payment upfront)
    const capped_first_payment = Math.min(first_payment_amount, selected_plan_price)

    // 4. Calculate remaining amounts
    const amount_remaining = selected_plan_price - capped_first_payment
    const payments_completed = 1
    const payments_remaining = plan_weeks - 1
    const next_payment_amount = payments_remaining > 0 
      ? Math.ceil(amount_remaining / payments_remaining)
      : 0

    // 5. Determine status
    let layaway_status: string
    let product_status: string
    
    if (capped_first_payment >= selected_plan_price) {
      layaway_status = 'completed'
      product_status = 'sold'
    } else {
      layaway_status = 'active'
      product_status = 'reserved'
    }

    // 6. Calculate dates
    const plan_start_date = new Date()
    const plan_end_date = new Date()
    plan_end_date.setDate(plan_end_date.getDate() + (plan_weeks * 7))

    const next_payment_due_date = payments_remaining > 0
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      : null

    // 7. Calculate legacy fields for compatibility
    const depositPercent = Math.round((capped_first_payment / selected_plan_price) * 100)
    const depositAmount = capped_first_payment
    const balanceAmount = amount_remaining

    // 8. Pricing validation (prevent rounding errors)
    const total_check = capped_first_payment + amount_remaining
    if (Math.abs(total_check - selected_plan_price) > 1) {
      console.error('[LAYAWAY CREATE] Pricing error:', {
        selected_plan_price,
        capped_first_payment,
        amount_remaining,
        total_check,
        diff: total_check - selected_plan_price
      })
      return NextResponse.json({ 
        error: 'Pricing calculation error. Please contact support.' 
      }, { status: 500 })
    }

    // 9. Create layaway record
    const { data: layaway, error: layawayError } = await supabaseAdmin
      .from('layaways')
      .insert({
        product_id,
        customer_name,
        customer_email,
        customer_phone,
        // New fields (weekly plans)
        plan_type: `${plan_weeks}_weekly_payments`,
        total_payments: plan_weeks,
        first_payment_amount: capped_first_payment,
        minimum_first_payment_amount: minimum_first_payment,
        total_amount: selected_plan_price,
        amount_paid: capped_first_payment,
        amount_remaining,
        payments_completed,
        payments_remaining,
        next_payment_amount: payments_remaining > 0 ? next_payment_amount : null,
        next_payment_due_date: next_payment_due_date?.toISOString() || null,
        plan_start_date: plan_start_date.toISOString(),
        plan_end_date: plan_end_date.toISOString(),
        // Legacy fields (compatibility)
        product_price: price_cash,
        deposit_percent: depositPercent,
        deposit_amount: depositAmount,
        balance_amount: balanceAmount,
        // Other
        currency: product.currency || 'MXN',
        status: layaway_status,
        expires_at: plan_end_date.toISOString()
      })
      .select()
      .single()

    if (layawayError || !layaway) {
      console.error('[LAYAWAY CREATE] Error creating layaway:', layawayError)
      return NextResponse.json({ 
        error: 'Failed to create layaway' 
      }, { status: 500 })
    }

    // 10. Update product status
    const { error: productUpdateError } = await supabaseAdmin
      .from('products')
      .update({ status: product_status })
      .eq('id', product_id)

    if (productUpdateError) {
      console.error('[LAYAWAY CREATE] Error updating product:', productUpdateError)
      // Non-fatal, continue
    }

    // 11. Create Stripe Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bagclue.com'
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: (product.currency || 'MXN').toLowerCase(),
            product_data: {
              name: `Apartado ${plan_weeks} semanas: ${product.brand} ${product.title}`,
              description: `Primer pago (semana 1 de ${plan_weeks})`,
              images: []
            },
            unit_amount: capped_first_payment * 100 // Stripe uses cents
          },
          quantity: 1
        }
      ],
      customer_email: customer_email,
      metadata: {
        payment_type: 'layaway_deposit',
        layaway_id: layaway.id,
        product_id: product.id,
        plan_weeks: plan_weeks.toString(),
        plan_total_amount: selected_plan_price.toString(),
        first_payment_amount: capped_first_payment.toString(),
        amount_remaining: amount_remaining.toString(),
        payments_remaining: payments_remaining.toString(),
        next_payment_amount: next_payment_amount.toString()
      },
      success_url: `${baseUrl}/layaway/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/catalogo/${product.id}?layaway_cancelled=true`
    })

    // 12. Update layaway with session ID
    await supabaseAdmin
      .from('layaways')
      .update({ deposit_session_id: session.id })
      .eq('id', layaway.id)

    // 13. Return response
    return NextResponse.json({
      layaway_id: layaway.id,
      layaway_token: layaway.layaway_token,
      checkout_url: session.url,
      plan_weeks,
      selected_plan_price,
      first_payment_amount: capped_first_payment,
      amount_remaining,
      payments_remaining,
      next_payment_amount,
      next_payment_due_date: next_payment_due_date?.toISOString() || null,
      status: layaway_status
    })

  } catch (error: any) {
    console.error('[LAYAWAY CREATE] Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
