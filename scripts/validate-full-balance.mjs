#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const layaway_id = 'aaaaaaaa-bbbb-cccc-dddd-000000000001'
const product_id = '9ed1749d-b82b-4ac5-865e-f2f332c439c3'
const user_id = '9b37d6cc-0b45-4a39-8226-d3022606fcd8'

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('TEST FASE 5C.3B.4B — VALIDACIÓN POST-PAGO')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

let allTests = []

// ════════════════════════════════════════════════════════════════════════════
// TEST 1: LAYAWAY_PAYMENTS
// ════════════════════════════════════════════════════════════════════════════

console.log('TEST 1: LAYAWAY_PAYMENTS')
console.log('─────────────────────────────────────────────────────────────────────')

const { data: payments, error: paymentsError } = await supabase
  .from('layaway_payments')
  .select('*')
  .eq('layaway_id', layaway_id)
  .order('payment_number', { ascending: true })

if (paymentsError) {
  console.error('❌ Error fetching payments:', paymentsError)
  process.exit(1)
}

const paid5to8 = payments.filter(p => [5,6,7,8].includes(p.payment_number) && p.status === 'paid')

console.log(`Payments #5-#8 marcados como paid: ${paid5to8.length}/4`)

for (const p of payments.filter(p => [5,6,7,8].includes(p.payment_number))) {
  const pass = p.status === 'paid' && p.amount_paid === p.amount_due && p.paid_at !== null && p.stripe_session_id !== null
  console.log(`  #${p.payment_number}: ${pass ? '✅' : '❌'} ${p.status} | paid: ${p.amount_paid} | paid_at: ${p.paid_at ? 'YES' : 'NO'} | session_id: ${p.stripe_session_id ? 'YES' : 'NO'}`)
  allTests.push({ test: `Payment #${p.payment_number} paid`, pass })
}

// Verificar que las 4 tienen mismo session_id y payment_intent_id
const session_ids = paid5to8.map(p => p.stripe_session_id).filter(Boolean)
const payment_intent_ids = paid5to8.map(p => p.stripe_payment_intent_id).filter(Boolean)

const sameSession = new Set(session_ids).size === 1 && session_ids.length === 4
const sameIntent = new Set(payment_intent_ids).size === 1 && payment_intent_ids.length === 4

console.log(`  ${sameSession ? '✅' : '❌'} Mismo stripe_session_id en las 4: ${sameSession ? session_ids[0] : 'MISMATCH'}`)
console.log(`  ${sameIntent ? '✅' : '❌'} Mismo stripe_payment_intent_id en las 4: ${sameIntent ? payment_intent_ids[0] : 'MISMATCH'}`)

allTests.push({ test: 'Same session_id #5-#8', pass: sameSession })
allTests.push({ test: 'Same payment_intent_id #5-#8', pass: sameIntent })

console.log('')

// ════════════════════════════════════════════════════════════════════════════
// TEST 2: LAYAWAY
// ════════════════════════════════════════════════════════════════════════════

console.log('TEST 2: LAYAWAY')
console.log('─────────────────────────────────────────────────────────────────────')

const { data: layaway, error: layawayError } = await supabase
  .from('layaways')
  .select('*')
  .eq('id', layaway_id)
  .single()

if (layawayError) {
  console.error('❌ Error fetching layaway:', layawayError)
  process.exit(1)
}

const layawayChecks = {
  'status = completed': layaway.status === 'completed',
  'amount_paid = 189000': layaway.amount_paid === 189000,
  'amount_remaining = 0': layaway.amount_remaining === 0,
  'payments_completed = 8': layaway.payments_completed === 8,
  'payments_remaining = 0': layaway.payments_remaining === 0,
  'completed_at filled': layaway.completed_at !== null,
  'order_id filled': layaway.order_id !== null,
  'next_payment_due_date = null': layaway.next_payment_due_date === null,
  'next_payment_amount = null': layaway.next_payment_amount === null,
  'consecutive_weeks = 0': layaway.consecutive_weeks_without_payment === 0
}

for (const [check, pass] of Object.entries(layawayChecks)) {
  console.log(`  ${pass ? '✅' : '❌'} ${check}`)
  allTests.push({ test: `Layaway ${check}`, pass })
}

console.log('')
console.log(`Order ID: ${layaway.order_id}`)
console.log(`Completed at: ${layaway.completed_at}`)
console.log('')

// ════════════════════════════════════════════════════════════════════════════
// TEST 3: ORDERS
// ════════════════════════════════════════════════════════════════════════════

console.log('TEST 3: ORDERS')
console.log('─────────────────────────────────────────────────────────────────────')

const { data: orders, error: ordersError } = await supabase
  .from('orders')
  .select('*')
  .eq('layaway_id', layaway_id)

if (ordersError) {
  console.error('❌ Error fetching orders:', ordersError)
  process.exit(1)
}

console.log(`Orders con layaway_id: ${orders.length}`)

const orderChecks = {
  'Exactly 1 order': orders.length === 1,
  'payment_status = paid': orders[0]?.payment_status === 'paid',
  'status = confirmed': orders[0]?.status === 'confirmed',
  'total = 189000': orders[0]?.total === 189000,
  'subtotal = 189000': orders[0]?.subtotal === 189000,
  'shipping = 0': orders[0]?.shipping === 0,
  'tracking_token filled': orders[0]?.tracking_token !== null,
  'tracking_token 32 chars': orders[0]?.tracking_token?.length === 32,
  'user_id correct': orders[0]?.user_id === user_id,
  'customer_email correct': orders[0]?.customer_email === 'jhonatanvenegas@usdtcapital.es',
  'stripe_session_id filled': orders[0]?.stripe_session_id !== null,
  'stripe_payment_intent_id filled': orders[0]?.stripe_payment_intent_id !== null
}

for (const [check, pass] of Object.entries(orderChecks)) {
  console.log(`  ${pass ? '✅' : '❌'} ${check}`)
  allTests.push({ test: `Orders ${check}`, pass })
}

if (orders.length > 0) {
  console.log('')
  console.log(`Order ID: ${orders[0].id}`)
  console.log(`Tracking token: ${orders[0].tracking_token}`)
  console.log(`Stripe session: ${orders[0].stripe_session_id}`)
  console.log(`Stripe payment_intent: ${orders[0].stripe_payment_intent_id}`)
}

console.log('')

// ════════════════════════════════════════════════════════════════════════════
// TEST 4: ORDER_ITEMS
// ════════════════════════════════════════════════════════════════════════════

console.log('TEST 4: ORDER_ITEMS')
console.log('─────────────────────────────────────────────────────────────────────')

if (orders.length === 0) {
  console.log('❌ No order to check items')
} else {
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orders[0].id)

  if (itemsError) {
    console.error('❌ Error fetching order_items:', itemsError)
  } else {
    console.log(`Order items: ${items.length}`)

    const itemChecks = {
      'Exactly 1 item': items.length === 1,
      'product_id correct': items[0]?.product_id === product_id,
      'quantity = 1': items[0]?.quantity === 1,
      'unit_price = 189000': items[0]?.unit_price === 189000,
      'subtotal = 189000': items[0]?.subtotal === 189000,
      'product_snapshot exists': items[0]?.product_snapshot !== null,
      'product_snapshot.title': items[0]?.product_snapshot?.title !== undefined,
      'product_snapshot.brand': items[0]?.product_snapshot?.brand !== undefined,
      'product_snapshot.slug': items[0]?.product_snapshot?.slug !== undefined,
      'product_snapshot.price': items[0]?.product_snapshot?.price !== undefined,
      'product_snapshot.currency': items[0]?.product_snapshot?.currency !== undefined
    }

    for (const [check, pass] of Object.entries(itemChecks)) {
      console.log(`  ${pass ? '✅' : '❌'} ${check}`)
      allTests.push({ test: `Order_items ${check}`, pass })
    }

    if (items.length > 0) {
      console.log('')
      console.log('Product snapshot:')
      console.log(`  title: ${items[0].product_snapshot?.title}`)
      console.log(`  brand: ${items[0].product_snapshot?.brand}`)
      console.log(`  model: ${items[0].product_snapshot?.model}`)
      console.log(`  color: ${items[0].product_snapshot?.color}`)
      console.log(`  slug: ${items[0].product_snapshot?.slug}`)
      console.log(`  price: ${items[0].product_snapshot?.price}`)
      console.log(`  currency: ${items[0].product_snapshot?.currency}`)
    }
  }
}

console.log('')

// ════════════════════════════════════════════════════════════════════════════
// TEST 5: PRODUCT
// ════════════════════════════════════════════════════════════════════════════

console.log('TEST 5: PRODUCT')
console.log('─────────────────────────────────────────────────────────────────────')

const { data: product, error: productError } = await supabase
  .from('products')
  .select('*')
  .eq('id', product_id)
  .single()

if (productError) {
  console.error('❌ Error fetching product:', productError)
} else {
  const productChecks = {
    'status = sold': product.status === 'sold',
    'stock = 0': product.stock === 0
  }

  for (const [check, pass] of Object.entries(productChecks)) {
    console.log(`  ${pass ? '✅' : '❌'} ${check}`)
    allTests.push({ test: `Product ${check}`, pass })
  }

  console.log('')
  console.log(`Product: ${product.brand} ${product.title}`)
  console.log(`Status: ${product.status}`)
  console.log(`Stock: ${product.stock}`)
}

console.log('')

// ════════════════════════════════════════════════════════════════════════════
// RESUMEN FINAL
// ════════════════════════════════════════════════════════════════════════════

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('RESUMEN FINAL')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

const passed = allTests.filter(t => t.pass).length
const total = allTests.length

console.log(`Tests: ${passed}/${total} PASS`)
console.log('')

if (passed === total) {
  console.log('✅ TODOS LOS TESTS PASARON')
  console.log('')
  console.log('FASE 5C.3B.4B: ✅ CERRADA')
} else {
  console.log('❌ ALGUNOS TESTS FALLARON')
  console.log('')
  console.log('Tests fallidos:')
  for (const t of allTests.filter(t => !t.pass)) {
    console.log(`  ❌ ${t.test}`)
  }
}

console.log('')

// Export session_id y payment_intent_id para reporte
if (orders.length > 0) {
  console.log('DATOS PARA REPORTE:')
  console.log(`  session_id: ${orders[0].stripe_session_id}`)
  console.log(`  payment_intent_id: ${orders[0].stripe_payment_intent_id}`)
  console.log(`  order_id: ${orders[0].id}`)
  console.log(`  tracking_token: ${orders[0].tracking_token}`)
  console.log('')
}
