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

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('TEST FASE 5C.3B.4B — ESTADO ANTES DEL PAGO')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

// 1. Layaway
const { data: layaway, error: layawayError } = await supabase
  .from('layaways')
  .select('*')
  .eq('id', layaway_id)
  .single()

if (layawayError || !layaway) {
  console.error('❌ Layaway not found:', layawayError)
  process.exit(1)
}

console.log('LAYAWAY:')
console.log(`  status: ${layaway.status}`)
console.log(`  amount_paid: ${layaway.amount_paid}`)
console.log(`  amount_remaining: ${layaway.amount_remaining}`)
console.log(`  payments_completed: ${layaway.payments_completed}`)
console.log(`  payments_remaining: ${layaway.payments_remaining}`)
console.log(`  order_id: ${layaway.order_id || 'null'}`)
console.log('')

// 2. Payments
const { data: payments, error: paymentsError } = await supabase
  .from('layaway_payments')
  .select('payment_number, status, amount_due, amount_paid, paid_at')
  .eq('layaway_id', layaway_id)
  .order('payment_number', { ascending: true })

if (paymentsError) {
  console.error('❌ Payments error:', paymentsError)
  process.exit(1)
}

console.log('PAYMENTS:')
for (const p of payments) {
  console.log(`  #${p.payment_number}: ${p.status} | due: ${p.amount_due} | paid: ${p.amount_paid || 'null'} | paid_at: ${p.paid_at || 'null'}`)
}
console.log('')

// 3. Product
const { data: product, error: productError } = await supabase
  .from('products')
  .select('id, title, brand, status, stock, price')
  .eq('id', layaway.product_id)
  .single()

if (productError) {
  console.error('❌ Product error:', productError)
  process.exit(1)
}

console.log('PRODUCT:')
console.log(`  id: ${product.id}`)
console.log(`  title: ${product.brand} ${product.title}`)
console.log(`  status: ${product.status}`)
console.log(`  stock: ${product.stock}`)
console.log(`  price: ${product.price}`)
console.log('')

// 4. Orders con layaway_id
const { data: existingOrders, error: ordersError } = await supabase
  .from('orders')
  .select('id, status, payment_status, total, created_at')
  .eq('layaway_id', layaway_id)

if (ordersError) {
  console.error('❌ Orders error:', ordersError)
  process.exit(1)
}

console.log('ORDERS CON LAYAWAY_ID:')
if (existingOrders.length === 0) {
  console.log('  (ninguna)')
} else {
  for (const o of existingOrders) {
    console.log(`  id: ${o.id} | status: ${o.status} | payment: ${o.payment_status} | total: ${o.total}`)
  }
}
console.log('')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('VALIDACIÓN ESTADO INICIAL')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

const checks = {
  'layaway.status = active': layaway.status === 'active',
  'amount_paid = 105000': layaway.amount_paid === 105000,
  'amount_remaining = 84000': layaway.amount_remaining === 84000,
  'payments_completed = 4': layaway.payments_completed === 4,
  'payments_remaining = 4': layaway.payments_remaining === 4,
  'payments #5-#8 = pending': payments.filter(p => [5,6,7,8].includes(p.payment_number) && p.status === 'pending').length === 4,
  'product.status = available': product.status === 'available',
  'product.stock = 1': product.stock === 1,
  'no orders con layaway_id': existingOrders.length === 0
}

for (const [check, pass] of Object.entries(checks)) {
  console.log(`  ${pass ? '✅' : '❌'} ${check}`)
}
console.log('')

const allPass = Object.values(checks).every(v => v)
if (allPass) {
  console.log('✅ ESTADO INICIAL CORRECTO - LISTO PARA TEST')
} else {
  console.log('❌ ESTADO INICIAL INCORRECTO - NO PROCEDER')
  process.exit(1)
}
console.log('')
