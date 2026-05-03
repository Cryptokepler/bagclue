import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Stripe from 'stripe'
import crypto from 'crypto'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia'
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
  const metadata_type = session.metadata?.type
  
  // Handle layaway installment payment (NEW - Fase 5C.3B.2)
  if (metadata_type === 'layaway_installment') {
    await handleLayawayInstallment(session)
    return
  }
  
  // Handle layaway full balance payment (NEW - Fase 5C.3B.4B)
  if (metadata_type === 'layaway_full_balance') {
    await handleLayawayFullBalance(session)
    return
  }
  
  // Handle layaway payments (OLD SYSTEM)
  if (metadata_type === 'layaway_deposit') {
    await handleLayawayDeposit(session)
    return
  }
  
  if (metadata_type === 'layaway_balance') {
    await handleLayawayBalance(session)
    return
  }
  
  // Handle normal order payment
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

// ===== LAYAWAY HANDLERS =====

async function handleLayawayDeposit(session: Stripe.Checkout.Session) {
  const layaway_id = session.metadata?.layaway_id

  if (!layaway_id) {
    console.error('[WEBHOOK] ERROR: No layaway_id in deposit session metadata')
    return
  }

  console.log(`[WEBHOOK] Processing layaway deposit for: ${layaway_id}`)

  // Update layaway: pending → active
  const { data: layaway, error: layawayError } = await supabaseAdmin
    .from('layaways')
    .update({
      status: 'active',
      deposit_payment_intent_id: session.payment_intent as string || null,
      deposit_paid_at: new Date().toISOString()
    })
    .eq('id', layaway_id)
    .select('product_id')
    .single()

  console.log('[WEBHOOK] Resultado actualizar layaway (deposit):', {
    success: !layawayError,
    layawayId: layaway_id,
    updatedStatus: 'active',
    error: layawayError?.message || null
  })

  if (layawayError || !layaway) {
    console.error('[WEBHOOK] ERROR updating layaway (deposit):', layawayError)
    return
  }

  // Update product: available → reserved
  const { error: productError } = await supabaseAdmin
    .from('products')
    .update({ status: 'reserved' })
    .eq('id', layaway.product_id)

  console.log('[WEBHOOK] Resultado actualizar product (reserved):', {
    success: !productError,
    productId: layaway.product_id,
    updatedStatus: 'reserved',
    error: productError?.message || null
  })

  console.log(`[WEBHOOK] SUCCESS: Layaway ${layaway_id} activated and product reserved`)
}

async function handleLayawayBalance(session: Stripe.Checkout.Session) {
  const layaway_id = session.metadata?.layaway_id

  if (!layaway_id) {
    console.error('[WEBHOOK] ERROR: No layaway_id in balance session metadata')
    return
  }

  console.log(`[WEBHOOK] Processing layaway balance for: ${layaway_id}`)

  // Get layaway details
  const { data: layaway, error: fetchError } = await supabaseAdmin
    .from('layaways')
    .select('*')
    .eq('id', layaway_id)
    .single()

  if (fetchError || !layaway) {
    console.error('[WEBHOOK] ERROR fetching layaway:', fetchError)
    return
  }

  // Update layaway: active → completed
  const { error: layawayError } = await supabaseAdmin
    .from('layaways')
    .update({
      status: 'completed',
      balance_payment_intent_id: session.payment_intent as string || null,
      balance_paid_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    })
    .eq('id', layaway_id)

  console.log('[WEBHOOK] Resultado actualizar layaway (completed):', {
    success: !layawayError,
    layawayId: layaway_id,
    updatedStatus: 'completed',
    error: layawayError?.message || null
  })

  if (layawayError) {
    console.error('[WEBHOOK] ERROR updating layaway (balance):', layawayError)
    return
  }

  // Create full order
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      customer_name: layaway.customer_name,
      customer_email: layaway.customer_email,
      customer_phone: layaway.customer_phone,
      total: layaway.product_price,
      subtotal: layaway.product_price,
      shipping: 0,
      status: 'confirmed',
      payment_status: 'paid',
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string || null,
      layaway_id: layaway.id
    })
    .select()
    .single()

  console.log('[WEBHOOK] Resultado crear order (from layaway):', {
    success: !orderError,
    orderId: order?.id || null,
    error: orderError?.message || null
  })

  if (orderError || !order) {
    console.error('[WEBHOOK] ERROR creating order from layaway:', orderError)
    return
  }

  // Create order item
  const { error: itemError } = await supabaseAdmin
    .from('order_items')
    .insert({
      order_id: order.id,
      product_id: layaway.product_id,
      quantity: 1,
      unit_price: layaway.product_price
    })

  console.log('[WEBHOOK] Resultado crear order_item:', {
    success: !itemError,
    error: itemError?.message || null
  })

  if (itemError) {
    console.error('[WEBHOOK] ERROR creating order item:', itemError)
  }

  // Link order back to layaway
  await supabaseAdmin
    .from('layaways')
    .update({ order_id: order.id })
    .eq('id', layaway_id)

  // Update product: reserved → sold
  const { error: productError } = await supabaseAdmin
    .from('products')
    .update({ status: 'sold', stock: 0 })
    .eq('id', layaway.product_id)

  console.log('[WEBHOOK] Resultado actualizar product (sold):', {
    success: !productError,
    productId: layaway.product_id,
    updatedStatus: 'sold',
    error: productError?.message || null
  })

  console.log(`[WEBHOOK] SUCCESS: Layaway ${layaway_id} completed, order ${order.id} created, product sold`)
}

// ===== LAYAWAY INSTALLMENT HANDLER (NEW - Fase 5C.3B.2) =====

async function handleLayawayInstallment(session: Stripe.Checkout.Session) {
  const layaway_id = session.metadata?.layaway_id
  const layaway_payment_id = session.metadata?.layaway_payment_id
  const payment_number = session.metadata?.payment_number
  const user_id = session.metadata?.user_id
  const customer_email = session.metadata?.customer_email

  console.log(`[WEBHOOK INSTALLMENT] Processing installment payment #${payment_number} for layaway: ${layaway_id}`)

  // === VALIDACIÓN 1: metadata.type === 'layaway_installment' ===
  // Ya validado en dispatcher, pero log para auditoría
  console.log('[WEBHOOK INSTALLMENT] ✓ metadata.type validated: layaway_installment')

  // === VALIDACIÓN 2: layaway_id exists ===
  if (!layaway_id) {
    console.error('[WEBHOOK INSTALLMENT] ERROR: Missing layaway_id in metadata')
    return
  }

  // === VALIDACIÓN 3: layaway_payment_id exists ===
  if (!layaway_payment_id) {
    console.error('[WEBHOOK INSTALLMENT] ERROR: Missing layaway_payment_id in metadata')
    return
  }

  // === VALIDACIÓN 4: Buscar layaway_payment por id ===
  const { data: payment, error: paymentFetchError } = await supabaseAdmin
    .from('layaway_payments')
    .select('*')
    .eq('id', layaway_payment_id)
    .single()

  if (paymentFetchError || !payment) {
    console.error('[WEBHOOK INSTALLMENT] ERROR: layaway_payment not found:', paymentFetchError?.message)
    return
  }

  console.log('[WEBHOOK INSTALLMENT] Payment found:', {
    payment_id: payment.id,
    payment_number: payment.payment_number,
    amount_due: payment.amount_due,
    current_status: payment.status,
    paid_at: payment.paid_at
  })

  // === VALIDACIÓN 5: Buscar layaway asociado ===
  const { data: layaway, error: layawayFetchError } = await supabaseAdmin
    .from('layaways')
    .select('*')
    .eq('id', layaway_id)
    .single()

  if (layawayFetchError || !layaway) {
    console.error('[WEBHOOK INSTALLMENT] ERROR: layaway not found:', layawayFetchError?.message)
    return
  }

  console.log('[WEBHOOK INSTALLMENT] Layaway found:', {
    layaway_id: layaway.id,
    status: layaway.status,
    total_amount: layaway.total_amount,
    amount_paid: layaway.amount_paid
  })

  // === VALIDACIÓN 6: layaway_payment.layaway_id coincide con metadata.layaway_id ===
  if (payment.layaway_id !== layaway_id) {
    console.error('[WEBHOOK INSTALLMENT] ERROR: Payment layaway_id mismatch:', {
      payment_layaway_id: payment.layaway_id,
      metadata_layaway_id: layaway_id
    })
    return
  }

  // === VALIDACIÓN 7 & 8: IDEMPOTENCIA - Payment ya está paid ===
  if (payment.status === 'paid') {
    console.log('[WEBHOOK INSTALLMENT] ✓ Payment already marked as paid (IDEMPOTENT - early return):', {
      payment_id: payment.id,
      payment_number: payment.payment_number,
      paid_at: payment.paid_at,
      amount_paid: payment.amount_paid
    })
    return  // Early return - No duplicar montos
  }

  // === VALIDACIÓN 9: session.payment_status === 'paid' ===
  if (session.payment_status !== 'paid') {
    console.error('[WEBHOOK INSTALLMENT] ERROR: Session not paid:', {
      payment_status: session.payment_status,
      session_id: session.id
    })
    return
  }

  // === VALIDACIÓN 10: Monto pagado coincide ===
  const amountDueCents = Math.round(payment.amount_due * 100)  // MXN a centavos
  const amountTotalCents = session.amount_total || 0  // Stripe ya está en centavos

  if (!session.amount_total) {
    console.error('[WEBHOOK INSTALLMENT] ERROR: Missing amount_total in session')
    return
  }

  if (amountDueCents !== amountTotalCents) {
    console.error('[WEBHOOK INSTALLMENT] WARNING: Amount mismatch:', {
      expected_cents: amountDueCents,
      actual_cents: amountTotalCents,
      difference: amountTotalCents - amountDueCents,
      expected_mxn: payment.amount_due,
      actual_mxn: amountTotalCents / 100
    })
    // NO retornar - loggear para investigación pero procesar igual
    // Stripe ya cobró, debemos reconciliar
  }

  // === VALIDACIÓN 11: currency MXN ===
  if (session.currency && session.currency.toUpperCase() !== 'MXN') {
    console.warn('[WEBHOOK INSTALLMENT] WARNING: Currency mismatch:', {
      expected: 'MXN',
      actual: session.currency
    })
    // NO retornar - loggear pero procesar
  }

  // === VALIDACIÓN 12: Guardar payment actualizado ===
  console.log('[WEBHOOK INSTALLMENT] Updating layaway_payment to paid...')

  const { error: paymentUpdateError } = await supabaseAdmin
    .from('layaway_payments')
    .update({
      status: 'paid',
      amount_paid: payment.amount_due,  // Usar amount_due como amount_paid
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: session.payment_intent as string || null,
      stripe_session_id: session.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', layaway_payment_id)

  if (paymentUpdateError) {
    console.error('[WEBHOOK INSTALLMENT] ERROR updating payment:', paymentUpdateError)
    return
  }

  console.log('[WEBHOOK INSTALLMENT] ✓ Payment updated to paid')

  // === RECALCULAR LAYAWAY DESDE DB ===
  console.log('[WEBHOOK INSTALLMENT] Recalculating layaway amounts from DB...')

  // Obtener todos los payments de este layaway
  const { data: allPayments, error: allPaymentsError } = await supabaseAdmin
    .from('layaway_payments')
    .select('amount_paid, status, due_date, amount_due, payment_number')
    .eq('layaway_id', layaway_id)
    .order('payment_number', { ascending: true })

  if (allPaymentsError || !allPayments) {
    console.error('[WEBHOOK INSTALLMENT] ERROR fetching all payments:', allPaymentsError)
    return
  }

  // Calcular amount_paid total (suma de payments paid)
  const totalPaid = allPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount_paid || 0), 0)

  // Calcular payments_completed (count payments paid)
  const paymentsCompletedCount = allPayments.filter(p => p.status === 'paid').length

  // Calcular amount_remaining
  const amountRemaining = (layaway.total_amount || 0) - totalPaid

  // Calcular payments_remaining
  const paymentsRemaining = (layaway.total_payments || 0) - paymentsCompletedCount

  // Encontrar next_payment_due_date y next_payment_amount
  const nextPendingPayment = allPayments
    .filter(p => p.status === 'pending' || p.status === 'overdue')
    .sort((a, b) => a.payment_number - b.payment_number)[0]

  const nextPaymentDueDate = nextPendingPayment?.due_date || null
  const nextPaymentAmount = nextPendingPayment?.amount_due || null

  console.log('[WEBHOOK INSTALLMENT] Recalculated amounts:', {
    total_amount: layaway.total_amount,
    amount_paid: totalPaid,
    amount_remaining: amountRemaining,
    payments_completed: paymentsCompletedCount,
    payments_remaining: paymentsRemaining,
    next_payment_due_date: nextPaymentDueDate,
    next_payment_amount: nextPaymentAmount
  })

  // Determinar nuevo status del layaway
  // Para esta fase: NO completar layaway aunque llegue a 100%
  // Mantener active si amount_paid < total_amount
  let newStatus = layaway.status  // Mantener status actual por defecto

  if (layaway.status === 'active') {
    newStatus = 'active'  // Mantener active
  }

  // Si llegó a 100%, por ahora NO completar (Fase 5C.3B.5)
  if (amountRemaining <= 0) {
    console.log('[WEBHOOK INSTALLMENT] Payment reached 100%, but NOT completing layaway in this phase (will be done in 5C.3B.5)')
    // newStatus = 'completed' // NO HACER EN ESTA FASE
  }

  // === ACTUALIZAR LAYAWAY ===
  console.log('[WEBHOOK INSTALLMENT] Updating layaway...')

  const { error: layawayUpdateError } = await supabaseAdmin
    .from('layaways')
    .update({
      amount_paid: totalPaid,
      amount_remaining: Math.max(amountRemaining, 0),
      payments_completed: paymentsCompletedCount,
      payments_remaining: Math.max(paymentsRemaining, 0),
      next_payment_due_date: nextPaymentDueDate,
      next_payment_amount: nextPaymentAmount,
      last_payment_at: new Date().toISOString(),
      consecutive_weeks_without_payment: 0,  // Reset contador
      status: newStatus
    })
    .eq('id', layaway_id)

  if (layawayUpdateError) {
    console.error('[WEBHOOK INSTALLMENT] ERROR updating layaway:', layawayUpdateError)
    return
  }

  console.log('[WEBHOOK INSTALLMENT] ✓ Layaway updated')

  // === LOG FINAL ===
  console.log(`[WEBHOOK INSTALLMENT] SUCCESS: Installment payment #${payment_number} confirmed for layaway ${layaway_id}`, {
    payment_id: payment.id,
    amount_paid: payment.amount_due,
    new_layaway_status: newStatus,
    total_paid: totalPaid,
    amount_remaining: Math.max(amountRemaining, 0),
    payments_completed: paymentsCompletedCount,
    payments_remaining: Math.max(paymentsRemaining, 0)
  })
}

// ===== LAYAWAY FULL BALANCE HANDLER (NEW - Fase 5C.3B.4B) =====

async function handleLayawayFullBalance(session: Stripe.Checkout.Session) {
  const layaway_id = session.metadata?.layaway_id
  const user_id = session.metadata?.user_id
  const customer_email = session.metadata?.customer_email

  console.log(`[WEBHOOK FULL_BALANCE] Processing full balance payment for layaway: ${layaway_id}`)

  // ═══════════════════════════════════════════════════════════════════
  // FASE 1: VALIDACIONES (FAIL-FAST)
  // ═══════════════════════════════════════════════════════════════════

  // Validación 1.1: layaway_id existe
  if (!layaway_id) {
    console.error('[WEBHOOK FULL_BALANCE] ERROR: Missing layaway_id in metadata')
    return
  }

  // Validación 1.2: session.payment_status === 'paid'
  if (session.payment_status !== 'paid') {
    console.error('[WEBHOOK FULL_BALANCE] ERROR: Session not paid:', {
      payment_status: session.payment_status,
      session_id: session.id
    })
    return
  }

  // Validación 1.3: session.amount_total existe
  if (!session.amount_total) {
    console.error('[WEBHOOK FULL_BALANCE] ERROR: Missing amount_total in session')
    return
  }

  // Validación 1.4: Buscar layaway por id
  const { data: layaway, error: layawayFetchError } = await supabaseAdmin
    .from('layaways')
    .select('*')
    .eq('id', layaway_id)
    .single()

  if (layawayFetchError || !layaway) {
    console.error('[WEBHOOK FULL_BALANCE] ERROR: Layaway not found:', layawayFetchError?.message)
    return
  }

  console.log('[WEBHOOK FULL_BALANCE] Layaway found:', {
    layaway_id: layaway.id,
    status: layaway.status,
    total_amount: layaway.total_amount,
    amount_paid: layaway.amount_paid,
    amount_remaining: layaway.amount_remaining
  })

  // Validación 1.5: layaway.status IN ('active', 'overdue')
  if (!['active', 'overdue'].includes(layaway.status)) {
    console.error('[WEBHOOK FULL_BALANCE] ERROR: Invalid layaway status:', {
      status: layaway.status,
      expected: ['active', 'overdue']
    })
    return
  }

  // Validación 1.6: layaway.amount_remaining > 0
  if (layaway.amount_remaining <= 0) {
    console.error('[WEBHOOK FULL_BALANCE] ERROR: Layaway already completed:', {
      amount_remaining: layaway.amount_remaining
    })
    return
  }

  // Validación 1.7: Buscar todos los payments del apartado
  const { data: allPayments, error: paymentsError } = await supabaseAdmin
    .from('layaway_payments')
    .select('*')
    .eq('layaway_id', layaway_id)
    .order('payment_number', { ascending: true })

  if (paymentsError || !allPayments) {
    console.error('[WEBHOOK FULL_BALANCE] ERROR: Failed to fetch payments:', paymentsError)
    return
  }

  // Validación 1.8: Calcular suma de payments pendientes
  const pendingPayments = allPayments.filter(p => p.status === 'pending' || p.status === 'overdue')
  const sumPending = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount_due || '0'), 0)

  console.log('[WEBHOOK FULL_BALANCE] Payments summary:', {
    total_payments: allPayments.length,
    pending_payments: pendingPayments.length,
    sum_pending: sumPending,
    amount_remaining: layaway.amount_remaining
  })

  // Validación 1.9: Validar suma pendientes vs amount_remaining (tolerancia $1)
  const diffPending = Math.abs(sumPending - layaway.amount_remaining)
  const toleranceMXN = 1

  if (diffPending > toleranceMXN) {
    console.error('[WEBHOOK FULL_BALANCE] ERROR: Pending payments sum mismatch:', {
      sum_pending: sumPending,
      amount_remaining: layaway.amount_remaining,
      difference: diffPending,
      tolerance: toleranceMXN
    })
    return
  }

  // Validación 1.10: Validar session.amount_total vs amount_remaining
  const expectedCents = Math.round(layaway.amount_remaining * 100)
  const actualCents = session.amount_total
  const diffCents = Math.abs(actualCents - expectedCents)
  const toleranceCents = 100 // $1 MXN

  if (diffCents > toleranceCents) {
    console.error('[WEBHOOK FULL_BALANCE] ERROR: Amount mismatch:', {
      expected_mxn: layaway.amount_remaining,
      expected_cents: expectedCents,
      actual_cents: actualCents,
      difference_cents: diffCents,
      tolerance_cents: toleranceCents
    })
    return
  }

  console.log('[WEBHOOK FULL_BALANCE] ✓ All validations passed')

  // ═══════════════════════════════════════════════════════════════════
  // FASE 2: IDEMPOTENCIA (EARLY RETURN)
  // ═══════════════════════════════════════════════════════════════════

  const { data: existingOrder, error: existingOrderError } = await supabaseAdmin
    .from('orders')
    .select('id, status, payment_status, created_at')
    .eq('layaway_id', layaway_id)
    .single()

  if (existingOrder && !existingOrderError) {
    console.log('[WEBHOOK FULL_BALANCE] ✓ IDEMPOTENT - Order already exists:', {
      order_id: existingOrder.id,
      layaway_id: layaway_id,
      created_at: existingOrder.created_at,
      status: existingOrder.status
    })
    return
  }

  // ═══════════════════════════════════════════════════════════════════
  // FASE 3: BUSCAR PRODUCTO (para product_snapshot)
  // ═══════════════════════════════════════════════════════════════════

  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('id, title, brand, model, color, slug, price, currency, status, stock')
    .eq('id', layaway.product_id)
    .single()

  if (productError || !product) {
    console.error('[WEBHOOK FULL_BALANCE] ERROR: Product not found:', productError)
    return
  }

  console.log('[WEBHOOK FULL_BALANCE] Product found:', {
    product_id: product.id,
    title: product.title,
    brand: product.brand,
    current_status: product.status,
    current_stock: product.stock
  })

  // ═══════════════════════════════════════════════════════════════════
  // FASE 4: MARCAR PAGOS PENDIENTES COMO PAID (LOOP INDIVIDUAL)
  // ═══════════════════════════════════════════════════════════════════

  console.log('[WEBHOOK FULL_BALANCE] Marking pending payments as paid...')

  for (const payment of pendingPayments) {
    const { error: updateError } = await supabaseAdmin
      .from('layaway_payments')
      .update({
        status: 'paid',
        amount_paid: payment.amount_due,
        paid_at: new Date().toISOString(),
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)

    if (updateError) {
      console.error('[WEBHOOK FULL_BALANCE] ERROR updating payment:', {
        payment_id: payment.id,
        payment_number: payment.payment_number,
        error: updateError
      })
      return
    }

    console.log('[WEBHOOK FULL_BALANCE] ✓ Payment marked as paid:', {
      payment_id: payment.id,
      payment_number: payment.payment_number,
      amount_paid: payment.amount_due
    })
  }

  // ═══════════════════════════════════════════════════════════════════
  // FASE 5: RECALCULAR LAYAWAY (DESDE DB)
  // ═══════════════════════════════════════════════════════════════════

  console.log('[WEBHOOK FULL_BALANCE] Recalculating layaway from DB...')

  // Refresh payments
  const { data: refreshedPayments, error: refreshError } = await supabaseAdmin
    .from('layaway_payments')
    .select('amount_paid, status')
    .eq('layaway_id', layaway_id)

  if (refreshError || !refreshedPayments) {
    console.error('[WEBHOOK FULL_BALANCE] ERROR refreshing payments:', refreshError)
    return
  }

  const totalPaid = refreshedPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + parseFloat(p.amount_paid || '0'), 0)

  const paymentsCompletedCount = refreshedPayments.filter(p => p.status === 'paid').length
  const amountRemaining = layaway.total_amount - totalPaid
  const paymentsRemaining = layaway.total_payments - paymentsCompletedCount

  console.log('[WEBHOOK FULL_BALANCE] Recalculated amounts:', {
    total_amount: layaway.total_amount,
    amount_paid: totalPaid,
    amount_remaining: amountRemaining,
    payments_completed: paymentsCompletedCount,
    payments_remaining: paymentsRemaining
  })

  // Validación: amount_remaining <= $1
  if (amountRemaining > 1) {
    console.error('[WEBHOOK FULL_BALANCE] ERROR: Incomplete payment:', {
      amount_remaining: amountRemaining,
      expected: '≤ $1'
    })
    return
  }

  // ═══════════════════════════════════════════════════════════════════
  // FASE 6: GENERAR TRACKING_TOKEN ÚNICO
  // ═══════════════════════════════════════════════════════════════════

  async function generateUniqueTrackingToken(): Promise<string> {
    const maxAttempts = 5
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const token = crypto.randomBytes(16).toString('hex')
      
      const { data: existing } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('tracking_token', token)
        .single()
      
      if (!existing) {
        console.log(`[WEBHOOK FULL_BALANCE] ✓ Tracking token generated (attempt ${attempt})`)
        return token
      }
      
      console.warn(`[WEBHOOK FULL_BALANCE] Tracking token collision (attempt ${attempt}/${maxAttempts})`)
    }
    
    throw new Error('Failed to generate unique tracking_token after 5 attempts')
  }

  const tracking_token = await generateUniqueTrackingToken()

  // ═══════════════════════════════════════════════════════════════════
  // FASE 7: CREAR ORDER (ORDEN FINAL)
  // ═══════════════════════════════════════════════════════════════════

  console.log('[WEBHOOK FULL_BALANCE] Creating order...')

  let order
  try {
    const { data: createdOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name: layaway.customer_name,
        customer_email: layaway.customer_email,
        customer_phone: layaway.customer_phone || null,
        shipping_address: null,
        user_id: user_id || null,
        subtotal: layaway.total_amount,
        shipping: 0,
        total: layaway.total_amount,
        status: 'confirmed',
        payment_status: 'paid',
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string || null,
        layaway_id: layaway.id,
        tracking_token: tracking_token,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orderError) {
      // Check si es unique constraint violation (idempotencia capa 3)
      if (orderError.code === '23505') {
        console.log('[WEBHOOK FULL_BALANCE] ✓ IDEMPOTENT - Caught unique constraint violation')
        return
      }
      throw orderError
    }

    order = createdOrder
    console.log('[WEBHOOK FULL_BALANCE] ✓ Order created:', {
      order_id: order.id,
      tracking_token: order.tracking_token,
      total: order.total
    })
  } catch (error: any) {
    console.error('[WEBHOOK FULL_BALANCE] ERROR creating order:', error)
    return
  }

  // ═══════════════════════════════════════════════════════════════════
  // FASE 8: CREAR ORDER_ITEMS (CON product_snapshot)
  // ═══════════════════════════════════════════════════════════════════

  console.log('[WEBHOOK FULL_BALANCE] Creating order_items...')

  const { error: itemError } = await supabaseAdmin
    .from('order_items')
    .insert({
      order_id: order.id,
      product_id: layaway.product_id,
      quantity: 1,
      unit_price: layaway.total_amount,
      subtotal: layaway.total_amount,
      product_snapshot: {
        title: product.title,
        brand: product.brand,
        model: product.model || null,
        color: product.color || null,
        slug: product.slug,
        price: product.price || layaway.total_amount,
        currency: product.currency || 'MXN'
      }
    })

  if (itemError) {
    console.error('[WEBHOOK FULL_BALANCE] ERROR creating order_items:', itemError)
    return
  }

  console.log('[WEBHOOK FULL_BALANCE] ✓ Order_items created')

  // ═══════════════════════════════════════════════════════════════════
  // FASE 9: COMPLETAR LAYAWAY
  // ═══════════════════════════════════════════════════════════════════

  console.log('[WEBHOOK FULL_BALANCE] Completing layaway...')

  const { error: layawayUpdateError } = await supabaseAdmin
    .from('layaways')
    .update({
      status: 'completed',
      amount_paid: totalPaid,
      amount_remaining: 0,
      payments_completed: paymentsCompletedCount,
      payments_remaining: 0,
      completed_at: new Date().toISOString(),
      last_payment_at: new Date().toISOString(),
      order_id: order.id,
      next_payment_due_date: null,
      next_payment_amount: null,
      consecutive_weeks_without_payment: 0
    })
    .eq('id', layaway_id)

  if (layawayUpdateError) {
    console.error('[WEBHOOK FULL_BALANCE] ERROR updating layaway:', layawayUpdateError)
    return
  }

  console.log('[WEBHOOK FULL_BALANCE] ✓ Layaway marked as completed')

  // ═══════════════════════════════════════════════════════════════════
  // FASE 10: MARCAR PRODUCTO SOLD + STOCK 0
  // ═══════════════════════════════════════════════════════════════════

  console.log('[WEBHOOK FULL_BALANCE] Marking product as sold...')

  const { error: productUpdateError } = await supabaseAdmin
    .from('products')
    .update({
      status: 'sold',
      stock: 0
    })
    .eq('id', layaway.product_id)

  if (productUpdateError) {
    console.error('[WEBHOOK FULL_BALANCE] ERROR updating product (non-fatal):', productUpdateError)
    // NO return - order ya creado, solo log
  } else {
    console.log('[WEBHOOK FULL_BALANCE] ✓ Product marked as sold')
  }

  // ═══════════════════════════════════════════════════════════════════
  // FASE 11: LOG SUCCESS
  // ═══════════════════════════════════════════════════════════════════

  console.log(`[WEBHOOK FULL_BALANCE] SUCCESS: Full balance payment confirmed for layaway ${layaway_id}`, {
    layaway_id: layaway.id,
    order_id: order.id,
    tracking_token: order.tracking_token,
    total_amount: layaway.total_amount,
    amount_paid: totalPaid,
    payments_completed: paymentsCompletedCount,
    product_id: product.id,
    product_status: 'sold'
  })
}
