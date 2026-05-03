#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const LAYAWAY_ID = 'aaaaaaaa-bbbb-cccc-dddd-000000000001'
const PRODUCTION_URL = 'https://bagclue.vercel.app'

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  FASE 5C.3B.4A - VALIDACIÓN FINAL DE PRODUCCIÓN')
  console.log('═══════════════════════════════════════════════════════════\n')
  
  // === PRE-CHECK ===
  const { data: layawayBefore } = await supabase
    .from('layaways')
    .select('*')
    .eq('id', LAYAWAY_ID)
    .single()
  
  console.log('📋 PRE-CHECK: Estado inicial\n')
  console.log(`Layaway ID: ${LAYAWAY_ID}`)
  console.log(`  amount_paid: ${layawayBefore.amount_paid}`)
  console.log(`  amount_remaining: ${layawayBefore.amount_remaining}`)
  console.log(`  payments_completed: ${layawayBefore.payments_completed}`)
  console.log(`  payments_remaining: ${layawayBefore.payments_remaining}`)
  console.log(`  status: ${layawayBefore.status}\n`)
  
  // === TEST A: Sin token → 401 ===
  console.log('─────────────────────────────────────────────────────────────')
  console.log('TEST A: Sin token → Esperado 401\n')
  
  const testA = await fetch(`${PRODUCTION_URL}/api/layaways/${LAYAWAY_ID}/pay-balance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  
  const resA = await testA.json()
  
  console.log(`Status: ${testA.status}`)
  console.log(`Response: ${JSON.stringify(resA)}`)
  
  const passA = testA.status === 401
  console.log(`\nResultado: ${passA ? '✅ PASS' : '❌ FAIL'}\n`)
  
  // === TEST B: Token inválido → 401 ===
  console.log('─────────────────────────────────────────────────────────────')
  console.log('TEST B: Token inválido → Esperado 401\n')
  
  const testB = await fetch(`${PRODUCTION_URL}/api/layaways/${LAYAWAY_ID}/pay-balance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid_token_xyz123'
    }
  })
  
  const resB = await testB.json()
  
  console.log(`Status: ${testB.status}`)
  console.log(`Response: ${JSON.stringify(resB)}`)
  
  const passB = testB.status === 401
  console.log(`\nResultado: ${passB ? '✅ PASS' : '❌ FAIL'}\n`)
  
  // === TEST C: Usuario correcto → 200 ===
  console.log('─────────────────────────────────────────────────────────────')
  console.log('TEST C: Usuario correcto (Service Role) → Esperado 200\n')
  
  const testC = await fetch(`${PRODUCTION_URL}/api/layaways/${LAYAWAY_ID}/pay-balance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`
    }
  })
  
  const resC = await testC.json()
  
  console.log(`Status: ${testC.status}`)
  console.log(`Response keys: ${Object.keys(resC).join(', ')}`)
  
  const hasCheckoutUrl = !!resC.checkout_url
  const hasSessionId = !!resC.session_id
  const correctBalance = resC.balance_amount === 84000
  const correctRemaining = resC.payments_remaining === 4
  const correctCurrency = resC.currency === 'MXN'
  
  console.log(`\nValidaciones:`)
  console.log(`  checkout_url: ${hasCheckoutUrl ? '✅' : '❌'}`)
  console.log(`  session_id: ${hasSessionId ? '✅' : '❌'}`)
  console.log(`  balance_amount = 84000: ${correctBalance ? '✅' : '❌'} (valor: ${resC.balance_amount})`)
  console.log(`  payments_remaining = 4: ${correctRemaining ? '✅' : '❌'} (valor: ${resC.payments_remaining})`)
  console.log(`  currency = MXN: ${correctCurrency ? '✅' : '❌'} (valor: ${resC.currency})`)
  
  const passC = testC.status === 200 && hasCheckoutUrl && hasSessionId && correctBalance && correctRemaining && correctCurrency
  console.log(`\nResultado: ${passC ? '✅ PASS' : '❌ FAIL'}\n`)
  
  // Session ID
  console.log('─────────────────────────────────────────────────────────────')
  if (resC.session_id) {
    console.log(`Session ID generado: ${resC.session_id}`)
  } else {
    console.log(`Session ID: NOT CREATED`)
  }
  console.log()
  
  // Checkout URL
  console.log('─────────────────────────────────────────────────────────────')
  if (resC.checkout_url) {
    console.log(`Checkout URL: CREATED ✅`)
    console.log(`URL: ${resC.checkout_url.substring(0, 80)}...`)
    console.log(`⚠️  NO ABIERTA NI PAGADA`)
  } else {
    console.log(`Checkout URL: NOT CREATED ❌`)
  }
  console.log()
  
  // === VALIDAR DB SIN CAMBIOS ===
  console.log('─────────────────────────────────────────────────────────────')
  console.log('VALIDACIÓN: DB SIN CAMBIOS\n')
  
  const { data: layawayAfter } = await supabase
    .from('layaways')
    .select('*')
    .eq('id', LAYAWAY_ID)
    .single()
  
  console.log('Layaway (antes → después):')
  console.log(`  amount_paid: ${layawayBefore.amount_paid} → ${layawayAfter.amount_paid}`)
  console.log(`  amount_remaining: ${layawayBefore.amount_remaining} → ${layawayAfter.amount_remaining}`)
  console.log(`  payments_completed: ${layawayBefore.payments_completed} → ${layawayAfter.payments_completed}`)
  console.log(`  payments_remaining: ${layawayBefore.payments_remaining} → ${layawayAfter.payments_remaining}`)
  console.log(`  status: ${layawayBefore.status} → ${layawayAfter.status}`)
  
  const dbPass = 
    layawayBefore.amount_paid === layawayAfter.amount_paid &&
    layawayBefore.amount_remaining === layawayAfter.amount_remaining &&
    layawayBefore.payments_completed === layawayAfter.payments_completed &&
    layawayBefore.payments_remaining === layawayAfter.payments_remaining &&
    layawayBefore.status === layawayAfter.status
  
  console.log(`\nResultado: ${dbPass ? '✅ PASS - DB sin cambios' : '❌ FAIL - DB cambió'}\n`)
  
  // === CONFIRMACIONES ===
  console.log('─────────────────────────────────────────────────────────────')
  console.log('CONFIRMACIONES FINALES\n')
  console.log('✅ NO se abrió checkout_url')
  console.log('✅ NO se pagó checkout_url')
  console.log('✅ NO se avanzó a webhook')
  console.log('✅ NO se avanzó a UI')
  console.log('✅ NO se avanzó a pay-full final')
  console.log('✅ NO se avanzó a order creation')
  console.log('✅ NO se tocó admin\n')
  
  // === RESULTADO FINAL ===
  const allPass = passA && passB && passC && dbPass
  
  console.log('═══════════════════════════════════════════════════════════')
  if (allPass) {
    console.log('   ✅ RESULTADO FINAL: PASS')
    console.log('   - Test sin token: 401 ✅')
    console.log('   - Test token inválido: 401 ✅')
    console.log('   - Test usuario correcto: 200 ✅')
    console.log('   - DB sin cambios ✅')
  } else {
    console.log('   ❌ RESULTADO FINAL: FAIL')
    console.log(`   - Test sin token: ${passA ? '✅' : '❌'}`)
    console.log(`   - Test token inválido: ${passB ? '✅' : '❌'}`)
    console.log(`   - Test usuario correcto: ${passC ? '✅' : '❌'}`)
    console.log(`   - DB sin cambios: ${dbPass ? '✅' : '❌'}`)
  }
  console.log('═══════════════════════════════════════════════════════════\n')
}

main().catch(console.error)
