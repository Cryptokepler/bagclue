#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function verify() {
  console.log('🔍 PASO 1: Verificando producto demo...\n')
  
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, slug, title, price, status, is_published')
    .eq('slug', 'chanel-classic-flap-negro')
    .single()
  
  if (productError) {
    if (productError.code === 'PGRST116') {
      console.log('❌ Producto NO encontrado')
      console.log('   Slug buscado: chanel-classic-flap-negro')
      console.log('\n⚠️  DETENIDO: El producto no existe')
      process.exit(1)
    }
    console.error('❌ Error consultando producto:', productError.message)
    process.exit(1)
  }
  
  console.log('✅ Producto encontrado:')
  console.log(`   ID: ${product.id}`)
  console.log(`   Slug: ${product.slug}`)
  console.log(`   Title: ${product.title}`)
  console.log(`   Price: ${product.price}`)
  console.log(`   Status: ${product.status}`)
  console.log(`   Published: ${product.is_published}`)
  
  // Validar precio
  if (product.price !== 189000) {
    console.log(`\n❌ Precio incorrecto: ${product.price} (esperado: 189000)`)
    console.log('⚠️  DETENIDO: El precio no coincide')
    process.exit(1)
  }
  
  console.log('\n✅ Producto cumple condiciones (precio 189000 MXN)')
  console.log('✅ Es producto demo (del seed script)')
  
  return product.id
}

async function checkExisting() {
  console.log('\n🔍 PASO 2: Verificando si ya existe test...\n')
  
  const testId = 'aaaaaaaa-bbbb-cccc-dddd-000000000001'
  
  const { data: existingLayaway } = await supabase
    .from('layaways')
    .select('id')
    .eq('id', testId)
    .single()
  
  if (existingLayaway) {
    console.log('⚠️  Ya existe layaway test con ID:', testId)
    console.log('⚠️  DETENIDO: No duplicaré. Esperando instrucción.')
    process.exit(1)
  }
  
  const { data: existingPayments, count } = await supabase
    .from('layaway_payments')
    .select('id', { count: 'exact' })
    .eq('layaway_id', testId)
  
  if (count > 0) {
    console.log(`⚠️  Ya existen ${count} payments para layaway_id:`, testId)
    console.log('⚠️  DETENIDO: No duplicaré. Esperando instrucción.')
    process.exit(1)
  }
  
  console.log('✅ No existe test previo. Seguro continuar.')
}

async function createTest(productId) {
  console.log('\n🚀 PASO 3: Creando layaway test...\n')
  
  const layawayData = {
    id: 'aaaaaaaa-bbbb-cccc-dddd-000000000001',
    user_id: '9b37d6cc-0b45-4a39-8226-d3022606fcd8',
    product_id: productId,
    product_price: 189000.00,
    customer_name: 'Jhonatan Venegas',
    customer_email: 'jhonatanvenegas@usdtcapital.es',
    customer_phone: '+34722385452',
    deposit_amount: 42000.00,
    balance_amount: 147000.00,
    total_amount: 189000.00,
    amount_paid: 63000.00,
    amount_remaining: 126000.00,
    first_payment_amount: 42000.00,
    minimum_first_payment_amount: 37800.00,
    plan_type: '8_weekly_payments',
    total_payments: 8,
    payments_completed: 2,
    payments_remaining: 6,
    plan_start_date: '2026-04-22T00:00:00-06:00',
    plan_end_date: '2026-06-10T23:59:59-06:00',
    next_payment_due_date: '2026-05-06T23:59:59-06:00',
    next_payment_amount: 21000.00,
    last_payment_at: '2026-04-29T14:30:00-06:00',
    expires_at: '2026-06-17T23:59:59-06:00',
    status: 'active',
    policy_version: 2,
    created_at: '2026-04-22T10:00:00-06:00'
  }
  
  const { data: layaway, error: layawayError } = await supabase
    .from('layaways')
    .insert(layawayData)
    .select()
    .single()
  
  if (layawayError) {
    console.error('❌ Error creando layaway:', layawayError.message)
    process.exit(1)
  }
  
  console.log('✅ Layaway creado:', layaway.id)
  
  console.log('\n🚀 PASO 4: Creando 8 layaway_payments...\n')
  
  const payments = [
    {
      id: 'aaaaaaaa-bbbb-cccc-dddd-000000000101',
      layaway_id: layaway.id,
      payment_number: 1,
      amount_due: 42000.00,
      amount_paid: 42000.00,
      due_date: '2026-04-22T23:59:59-06:00',
      paid_at: '2026-04-22T12:15:00-06:00',
      status: 'paid',
      payment_type: 'first',
      created_at: '2026-04-22T10:00:00-06:00'
    },
    {
      id: 'aaaaaaaa-bbbb-cccc-dddd-000000000102',
      layaway_id: layaway.id,
      payment_number: 2,
      amount_due: 21000.00,
      amount_paid: 21000.00,
      due_date: '2026-04-29T23:59:59-06:00',
      paid_at: '2026-04-29T14:30:00-06:00',
      status: 'paid',
      payment_type: 'installment',
      created_at: '2026-04-22T10:00:00-06:00'
    },
    {
      id: 'aaaaaaaa-bbbb-cccc-dddd-000000000103',
      layaway_id: layaway.id,
      payment_number: 3,
      amount_due: 21000.00,
      amount_paid: null,
      due_date: '2026-05-06T23:59:59-06:00',
      paid_at: null,
      status: 'pending',
      payment_type: 'installment',
      created_at: '2026-04-22T10:00:00-06:00'
    },
    {
      id: 'aaaaaaaa-bbbb-cccc-dddd-000000000104',
      layaway_id: layaway.id,
      payment_number: 4,
      amount_due: 21000.00,
      amount_paid: null,
      due_date: '2026-05-13T23:59:59-06:00',
      paid_at: null,
      status: 'pending',
      payment_type: 'installment',
      created_at: '2026-04-22T10:00:00-06:00'
    },
    {
      id: 'aaaaaaaa-bbbb-cccc-dddd-000000000105',
      layaway_id: layaway.id,
      payment_number: 5,
      amount_due: 21000.00,
      amount_paid: null,
      due_date: '2026-05-20T23:59:59-06:00',
      paid_at: null,
      status: 'pending',
      payment_type: 'installment',
      created_at: '2026-04-22T10:00:00-06:00'
    },
    {
      id: 'aaaaaaaa-bbbb-cccc-dddd-000000000106',
      layaway_id: layaway.id,
      payment_number: 6,
      amount_due: 21000.00,
      amount_paid: null,
      due_date: '2026-05-27T23:59:59-06:00',
      paid_at: null,
      status: 'pending',
      payment_type: 'installment',
      created_at: '2026-04-22T10:00:00-06:00'
    },
    {
      id: 'aaaaaaaa-bbbb-cccc-dddd-000000000107',
      layaway_id: layaway.id,
      payment_number: 7,
      amount_due: 21000.00,
      amount_paid: null,
      due_date: '2026-06-03T23:59:59-06:00',
      paid_at: null,
      status: 'pending',
      payment_type: 'installment',
      created_at: '2026-04-22T10:00:00-06:00'
    },
    {
      id: 'aaaaaaaa-bbbb-cccc-dddd-000000000108',
      layaway_id: layaway.id,
      payment_number: 8,
      amount_due: 21000.00,
      amount_paid: null,
      due_date: '2026-06-10T23:59:59-06:00',
      paid_at: null,
      status: 'pending',
      payment_type: 'final',
      created_at: '2026-04-22T10:00:00-06:00'
    }
  ]
  
  const { data: createdPayments, error: paymentsError } = await supabase
    .from('layaway_payments')
    .insert(payments)
    .select()
  
  if (paymentsError) {
    console.error('❌ Error creando payments:', paymentsError.message)
    process.exit(1)
  }
  
  console.log(`✅ ${createdPayments.length} payments creados`)
}

async function validate() {
  console.log('\n📊 PASO 5: Validando datos creados...\n')
  
  const testId = 'aaaaaaaa-bbbb-cccc-dddd-000000000001'
  
  // Validar layaway
  const { data: layaway } = await supabase
    .from('layaways')
    .select('*')
    .eq('id', testId)
    .single()
  
  console.log('✅ Layaway creado:')
  console.log(`   ID: ${layaway.id}`)
  console.log(`   Customer: ${layaway.customer_email}`)
  console.log(`   Total: ${layaway.total_amount}`)
  console.log(`   Paid: ${layaway.amount_paid}`)
  console.log(`   Remaining: ${layaway.amount_remaining}`)
  console.log(`   Payments: ${layaway.payments_completed}/${layaway.total_payments}`)
  console.log(`   Status: ${layaway.status}`)
  
  // Validar payments
  const { data: payments, count } = await supabase
    .from('layaway_payments')
    .select('payment_number, amount_due, status', { count: 'exact' })
    .eq('layaway_id', testId)
    .order('payment_number')
  
  console.log(`\n✅ ${count} Payments creados:`)
  payments.forEach(p => {
    console.log(`   #${p.payment_number}: $${p.amount_due} (${p.status})`)
  })
  
  // Validar suma
  const { data: sumResult } = await supabase
    .from('layaway_payments')
    .select('amount_due')
    .eq('layaway_id', testId)
  
  const totalSum = sumResult.reduce((sum, p) => sum + parseFloat(p.amount_due), 0)
  
  console.log(`\n📊 Validación de montos:`)
  console.log(`   SUM(amount_due): ${totalSum}`)
  console.log(`   Esperado: 189000`)
  console.log(`   Match: ${totalSum === 189000 ? '✅' : '❌'}`)
  
  if (totalSum !== 189000) {
    console.log('\n❌ ERROR: La suma de payments no coincide con total_amount')
    process.exit(1)
  }
  
  console.log('\n✅ TODOS LOS DATOS CREADOS Y VALIDADOS CORRECTAMENTE')
  console.log('\n📍 Próximo paso: Validar en producción')
  console.log('   URL: https://bagclue.vercel.app/account/layaways')
  console.log(`   Layaway ID: ${testId}`)
}

async function run() {
  try {
    const productId = await verify()
    await checkExisting()
    await createTest(productId)
    await validate()
  } catch (err) {
    console.error('\n❌ Error inesperado:', err.message)
    process.exit(1)
  }
}

run()
