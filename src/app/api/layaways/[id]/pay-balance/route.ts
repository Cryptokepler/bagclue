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

    // ===== 1. AUTENTICACIÓN REQUERIDA =====
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      console.error('[PAY BALANCE] ERROR: No authorization header')
      return NextResponse.json({ 
        error: 'Unauthorized - Authentication required' 
      }, { status: 401 })
    }

    // ===== 2. VALIDAR TOKEN CON SUPABASE =====
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.error('[PAY BALANCE] ERROR: Invalid token:', authError?.message)
      return NextResponse.json({ 
        error: 'Unauthorized - Invalid token' 
      }, { status: 401 })
    }

    // ===== 3. OBTENER user.id y user.email =====
    const userId = user.id
    const userEmail = user.email

    console.log('[PAY BALANCE] Request:', {
      layawayId,
      userId,
      userEmail,
      timestamp: new Date().toISOString()
    })

    // ===== 4. BUSCAR LAYAWAY POR ID =====
    const { data: layaway, error: fetchError } = await supabaseAdmin
      .from('layaways')
      .select(`
        id,
        user_id,
        customer_email,
        customer_name,
        product_id,
        status,
        total_amount,
        amount_paid,
        amount_remaining,
        total_payments,
        payments_completed,
        payments_remaining,
        plan_type,
        currency,
        product:products(id, title, brand)
      `)
      .eq('id', layawayId)
      .single()

    if (fetchError || !layaway) {
      console.error('[PAY BALANCE] ERROR: Layaway not found:', fetchError?.message)
      return NextResponse.json({ 
        error: 'Layaway not found' 
      }, { status: 404 })
    }

    console.log('[PAY BALANCE] Layaway found:', {
      layaway_id: layaway.id,
      status: layaway.status,
      amount_remaining: layaway.amount_remaining,
      payments_remaining: layaway.payments_remaining
    })

    // ===== 5. VALIDAR OWNERSHIP =====
    const ownsLayaway = 
      layaway.user_id === userId || 
      layaway.customer_email === userEmail

    if (!ownsLayaway) {
      console.error('[PAY BALANCE] ERROR: Ownership validation failed:', {
        layaway_user_id: layaway.user_id,
        layaway_email: layaway.customer_email,
        authenticated_user_id: userId,
        authenticated_email: userEmail
      })
      return NextResponse.json({ 
        error: 'Forbidden - You do not own this layaway' 
      }, { status: 403 })
    }

    console.log('[PAY BALANCE] ✓ Ownership validated')

    // ===== 6. VALIDAR ESTADO DEL LAYAWAY (payable: active, overdue) =====
    const payableStatuses = ['active', 'overdue']
    const forbiddenStatuses = [
      'completed', 
      'expired', 
      'forfeited', 
      'cancelled_for_non_payment', 
      'cancelled_manual', 
      'forfeiture_pending',
      'cancelled'
    ]

    if (!payableStatuses.includes(layaway.status)) {
      console.error('[PAY BALANCE] ERROR: Invalid status for payment:', layaway.status)
      return NextResponse.json({ 
        error: `Cannot pay balance. Layaway status is: ${layaway.status}`,
        status: layaway.status
      }, { status: 400 })
    }

    if (forbiddenStatuses.includes(layaway.status)) {
      console.error('[PAY BALANCE] ERROR: Forbidden status:', layaway.status)
      return NextResponse.json({ 
        error: `Cannot pay balance. Layaway is ${layaway.status}`,
        status: layaway.status
      }, { status: 400 })
    }

    console.log('[PAY BALANCE] ✓ Status validated:', layaway.status)

    // ===== 7. VALIDAR amount_remaining > 0 =====
    if (!layaway.amount_remaining || layaway.amount_remaining <= 0) {
      console.error('[PAY BALANCE] ERROR: No balance remaining:', layaway.amount_remaining)
      return NextResponse.json({ 
        error: 'No balance remaining to pay',
        amount_remaining: layaway.amount_remaining
      }, { status: 400 })
    }

    console.log('[PAY BALANCE] ✓ Balance remaining validated:', layaway.amount_remaining)

    // ===== 8. VALIDAR payments_remaining > 0 =====
    if (!layaway.payments_remaining || layaway.payments_remaining <= 0) {
      console.error('[PAY BALANCE] ERROR: No payments remaining:', layaway.payments_remaining)
      return NextResponse.json({ 
        error: 'No payments remaining',
        payments_remaining: layaway.payments_remaining
      }, { status: 400 })
    }

    console.log('[PAY BALANCE] ✓ Payments remaining validated:', layaway.payments_remaining)

    // ===== 9. BUSCAR CUOTAS PENDIENTES/OVERDUE =====
    const { data: pendingPayments, error: paymentsError } = await supabaseAdmin
      .from('layaway_payments')
      .select('id, payment_number, amount_due, status, due_date')
      .eq('layaway_id', layawayId)
      .in('status', ['pending', 'overdue'])
      .order('payment_number', { ascending: true })

    if (paymentsError || !pendingPayments || pendingPayments.length === 0) {
      console.error('[PAY BALANCE] ERROR: No pending payments found:', paymentsError?.message)
      return NextResponse.json({ 
        error: 'No pending payments found for this layaway' 
      }, { status: 400 })
    }

    console.log('[PAY BALANCE] ✓ Found pending payments:', {
      count: pendingPayments.length,
      payments: pendingPayments.map(p => ({
        number: p.payment_number,
        amount: p.amount_due,
        status: p.status
      }))
    })

    // ===== 10. VALIDAR SUMA DE CUOTAS PENDIENTES = amount_remaining =====
    const sumPendingPayments = pendingPayments.reduce((sum, p) => sum + (p.amount_due || 0), 0)
    const difference = Math.abs(sumPendingPayments - layaway.amount_remaining)
    const tolerance = 1  // $1 MXN tolerancia para redondeo

    console.log('[PAY BALANCE] Validation - Sum of pending payments:', {
      sum_pending_payments: sumPendingPayments,
      layaway_amount_remaining: layaway.amount_remaining,
      difference: difference,
      tolerance: tolerance
    })

    if (difference > tolerance) {
      console.error('[PAY BALANCE] ERROR: Sum mismatch exceeds tolerance:', {
        expected: layaway.amount_remaining,
        actual: sumPendingPayments,
        difference: difference,
        tolerance: tolerance
      })
      return NextResponse.json({ 
        error: 'Internal inconsistency: sum of pending payments does not match balance',
        details: {
          expected: layaway.amount_remaining,
          actual: sumPendingPayments,
          difference: difference
        }
      }, { status: 500 })
    }

    if (difference > 0.01) {
      console.warn('[PAY BALANCE] WARNING: Small mismatch within tolerance:', {
        difference: difference
      })
    }

    console.log('[PAY BALANCE] ✓ Sum validation passed')

    // ===== 11. CALCULAR BALANCE_AMOUNT =====
    const balanceAmount = layaway.amount_remaining

    console.log('[PAY BALANCE] Balance to charge:', {
      balance_amount: balanceAmount,
      currency: layaway.currency || 'MXN'
    })

    // ===== 12. CREAR STRIPE CHECKOUT SESSION =====
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bagclue.vercel.app'
    
    // product es un array (JOIN result) - acceder al primer elemento
    const product = Array.isArray(layaway.product) ? layaway.product[0] : layaway.product
    const productTitle = product?.title || 'Producto'
    const productBrand = product?.brand || ''

    console.log('[PAY BALANCE] Creating Stripe session...', {
      balance_amount: balanceAmount,
      currency: layaway.currency || 'MXN',
      payments_remaining: layaway.payments_remaining
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: (layaway.currency || 'MXN').toLowerCase(),
            product_data: {
              name: `Saldo completo: ${productBrand} ${productTitle}`,
              description: `Liquidación total del apartado (${layaway.payments_remaining} pagos restantes)`,
              images: []
            },
            unit_amount: Math.round(balanceAmount * 100) // Stripe usa centavos
          },
          quantity: 1
        }
      ],
      customer_email: layaway.customer_email,
      metadata: {
        type: 'layaway_full_balance',
        layaway_id: layaway.id,
        user_id: userId,
        customer_email: layaway.customer_email,
        balance_amount: balanceAmount.toString(),
        payments_remaining: layaway.payments_remaining.toString(),
        total_amount: layaway.total_amount.toString(),
        amount_paid_before: (layaway.amount_paid || 0).toString()
      },
      success_url: `${baseUrl}/account/layaways/${layaway.id}?payment_success=true&payment_type=balance`,
      cancel_url: `${baseUrl}/account/layaways/${layaway.id}?payment_cancelled=true&payment_type=balance`,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutos
    })

    console.log('[PAY BALANCE] ✓ Stripe session created:', {
      session_id: session.id,
      url: session.url?.slice(0, 50) + '...',
      expires_at: new Date(session.expires_at! * 1000).toISOString()
    })

    // ===== 13. RETORNAR CHECKOUT_URL =====
    console.log('[PAY BALANCE] SUCCESS - Returning checkout URL')

    return NextResponse.json({
      checkout_url: session.url,
      session_id: session.id,
      balance_amount: balanceAmount,
      payments_remaining: layaway.payments_remaining,
      currency: layaway.currency || 'MXN',
      expires_at: new Date(session.expires_at! * 1000).toISOString(),
      message: 'Balance payment session created successfully'
    })

  } catch (error: any) {
    console.error('[PAY BALANCE] FATAL ERROR:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
