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
      console.error('[PAY INSTALLMENT] ERROR: No authorization header')
      return NextResponse.json({ 
        error: 'Unauthorized - Authentication required' 
      }, { status: 401 })
    }

    // ===== 2. VALIDAR TOKEN CON SUPABASE =====
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.error('[PAY INSTALLMENT] ERROR: Invalid token:', authError?.message)
      return NextResponse.json({ 
        error: 'Unauthorized - Invalid token' 
      }, { status: 401 })
    }

    // ===== 3. OBTENER user.id y user.email =====
    const userId = user.id
    const userEmail = user.email

    console.log('[PAY INSTALLMENT] Request:', {
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
        plan_type,
        currency,
        product:products(id, title, brand)
      `)
      .eq('id', layawayId)
      .single()

    if (fetchError || !layaway) {
      console.error('[PAY INSTALLMENT] ERROR: Layaway not found:', fetchError?.message)
      return NextResponse.json({ 
        error: 'Layaway not found' 
      }, { status: 404 })
    }

    // ===== 5. VALIDAR OWNERSHIP =====
    const ownsLayaway = 
      layaway.user_id === userId || 
      layaway.customer_email === userEmail

    if (!ownsLayaway) {
      console.error('[PAY INSTALLMENT] ERROR: Ownership validation failed:', {
        layaway_user_id: layaway.user_id,
        layaway_email: layaway.customer_email,
        authenticated_user_id: userId,
        authenticated_email: userEmail
      })
      return NextResponse.json({ 
        error: 'Forbidden - You do not own this layaway' 
      }, { status: 403 })
    }

    console.log('[PAY INSTALLMENT] ✓ Ownership validated')

    // ===== 6. VALIDAR ESTADO DEL LAYAWAY =====
    const payableStatuses = ['active', 'overdue']
    const forbiddenStatuses = ['completed', 'cancelled', 'forfeited', 'cancelled_for_non_payment', 'cancelled_manual']

    if (!payableStatuses.includes(layaway.status)) {
      console.error('[PAY INSTALLMENT] ERROR: Invalid status:', layaway.status)
      return NextResponse.json({ 
        error: `Cannot pay installment. Layaway status is: ${layaway.status}`,
        status: layaway.status
      }, { status: 400 })
    }

    if (forbiddenStatuses.includes(layaway.status)) {
      console.error('[PAY INSTALLMENT] ERROR: Forbidden status:', layaway.status)
      return NextResponse.json({ 
        error: `Cannot pay installment. Layaway is ${layaway.status}`,
        status: layaway.status
      }, { status: 400 })
    }

    console.log('[PAY INSTALLMENT] ✓ Status validated:', layaway.status)

    // ===== 7. BUSCAR PRÓXIMA CUOTA PENDIENTE =====
    const { data: nextPayment, error: paymentError } = await supabaseAdmin
      .from('layaway_payments')
      .select('*')
      .eq('layaway_id', layawayId)
      .in('status', ['pending', 'overdue'])
      .order('payment_number', { ascending: true })
      .limit(1)
      .single()

    if (paymentError || !nextPayment) {
      console.error('[PAY INSTALLMENT] ERROR: No pending payments found:', paymentError?.message)
      return NextResponse.json({ 
        error: 'No pending payments found for this layaway' 
      }, { status: 400 })
    }

    console.log('[PAY INSTALLMENT] ✓ Next pending payment found:', {
      payment_id: nextPayment.id,
      payment_number: nextPayment.payment_number,
      amount_due: nextPayment.amount_due,
      due_date: nextPayment.due_date,
      status: nextPayment.status
    })

    // ===== 8. VALIDAR QUE NO ESTÉ YA PAGADA =====
    if (nextPayment.status === 'paid') {
      console.error('[PAY INSTALLMENT] ERROR: Payment already paid')
      return NextResponse.json({ 
        error: 'Payment already completed',
        payment_number: nextPayment.payment_number
      }, { status: 400 })
    }

    // ===== 9. VALIDAR AMOUNT_DUE > 0 =====
    if (!nextPayment.amount_due || nextPayment.amount_due <= 0) {
      console.error('[PAY INSTALLMENT] ERROR: Invalid amount_due:', nextPayment.amount_due)
      return NextResponse.json({ 
        error: 'Invalid payment amount',
        amount_due: nextPayment.amount_due
      }, { status: 400 })
    }

    console.log('[PAY INSTALLMENT] ✓ All validations passed')

    // ===== 10. CREAR STRIPE CHECKOUT SESSION =====
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bagclue.vercel.app'
    
    // product es un array (JOIN result) - acceder al primer elemento
    const product = Array.isArray(layaway.product) ? layaway.product[0] : layaway.product
    const productTitle = product?.title || 'Producto'
    const productBrand = product?.brand || ''

    console.log('[PAY INSTALLMENT] Creating Stripe session...', {
      amount_due: nextPayment.amount_due,
      currency: layaway.currency || 'MXN',
      payment_number: nextPayment.payment_number,
      total_payments: layaway.total_payments
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: (layaway.currency || 'MXN').toLowerCase(),
            product_data: {
              name: `Cuota #${nextPayment.payment_number}: ${productBrand} ${productTitle}`,
              description: `Pago ${nextPayment.payment_number}/${layaway.total_payments} del plan de apartado`,
              images: []
            },
            unit_amount: Math.round(nextPayment.amount_due * 100) // Stripe usa centavos
          },
          quantity: 1
        }
      ],
      customer_email: layaway.customer_email,
      metadata: {
        type: 'layaway_installment',
        layaway_id: layaway.id,
        layaway_payment_id: nextPayment.id,
        payment_number: nextPayment.payment_number.toString(),
        payment_type: nextPayment.payment_type || 'installment',
        user_id: userId,
        customer_email: layaway.customer_email
      },
      success_url: `${baseUrl}/account/layaways/${layaway.id}?payment_success=true&payment_number=${nextPayment.payment_number}`,
      cancel_url: `${baseUrl}/account/layaways/${layaway.id}?payment_cancelled=true`,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutos
    })

    console.log('[PAY INSTALLMENT] ✓ Stripe session created:', {
      session_id: session.id,
      url: session.url?.slice(0, 50) + '...',
      expires_at: new Date(session.expires_at! * 1000).toISOString()
    })

    // ===== 11. GUARDAR SESSION_ID EN LAYAWAY_PAYMENT =====
    // DECISIÓN: Crear nueva sesión y actualizar session_id
    // Si había sesión anterior no pagada, se reemplaza
    const { error: updateError } = await supabaseAdmin
      .from('layaway_payments')
      .update({ 
        stripe_session_id: session.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', nextPayment.id)

    if (updateError) {
      console.error('[PAY INSTALLMENT] ERROR updating payment with session_id:', updateError)
      return NextResponse.json({ 
        error: 'Failed to save payment session',
        details: updateError.message
      }, { status: 500 })
    }

    console.log('[PAY INSTALLMENT] ✓ Session ID saved to layaway_payment')

    // ===== 12. RETORNAR CHECKOUT_URL =====
    console.log('[PAY INSTALLMENT] SUCCESS - Returning checkout URL')

    return NextResponse.json({
      checkout_url: session.url,
      session_id: session.id,
      payment_id: nextPayment.id,
      payment_number: nextPayment.payment_number,
      amount_due: nextPayment.amount_due,
      due_date: nextPayment.due_date,
      currency: layaway.currency || 'MXN',
      expires_at: new Date(session.expires_at! * 1000).toISOString(),
      message: 'Payment session created successfully'
    })

  } catch (error: any) {
    console.error('[PAY INSTALLMENT] FATAL ERROR:', {
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
