#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const email = 'jhonatanvenegas@usdtcapital.es'
const layaway_id = 'aaaaaaaa-bbbb-cccc-dddd-000000000001'

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('PASO 1: Crear Checkout Session para pagar saldo completo')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

// 1. Login para obtener token
console.log('1. Obteniendo token de usuario...')
console.log(`   Email: ${email}`)

const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
  email: email,
  password: 'bagclue2026'  // Password del test user
})

if (authError || !user) {
  console.error('❌ Auth error:', authError)
  console.log('')
  console.log('⚠️  Si el login falla, usa el navegador:')
  console.log('   1. Login en https://bagclue.vercel.app/account/login')
  console.log(`   2. Email: ${email}`)
  console.log('   3. Password: bagclue2026')
  console.log('   4. DevTools → Application → Local Storage')
  console.log('   5. Buscar "sb-*-auth-token"')
  console.log('   6. Copiar access_token')
  console.log('')
  process.exit(1)
}

const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token

if (!token) {
  console.error('❌ No token obtained')
  process.exit(1)
}

console.log(`   ✅ Token obtenido: ${token.slice(0, 20)}...`)
console.log(`   User ID: ${user.id}`)
console.log('')

// 2. Llamar endpoint pay-balance
console.log('2. Llamando endpoint /api/layaways/[id]/pay-balance...')
console.log(`   Layaway ID: ${layaway_id}`)

const response = await fetch(`https://bagclue.vercel.app/api/layaways/${layaway_id}/pay-balance`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})

const data = await response.json()

console.log(`   Status: ${response.status}`)
console.log('')

if (response.status !== 200) {
  console.error('❌ Error:', data)
  process.exit(1)
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✅ SESSION CREADA')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log('DATOS DE LA SESSION:')
console.log(`  session_id: ${data.session_id}`)
console.log(`  balance_amount: ${data.balance_amount}`)
console.log(`  payments_remaining: ${data.payments_remaining}`)
console.log(`  currency: ${data.currency}`)
console.log('')
console.log('CHECKOUT URL:')
console.log(`  ${data.checkout_url}`)
console.log('')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('SIGUIENTE PASO:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log('1. Abrir el checkout_url en el navegador')
console.log('2. Completar pago con tarjeta test Stripe:')
console.log('   - Número: 4242 4242 4242 4242')
console.log('   - Exp: cualquier fecha futura')
console.log('   - CVC: cualquier 3 dígitos')
console.log('   - ZIP: cualquier 5 dígitos')
console.log('3. Esperar webhook (automático)')
console.log('4. Ejecutar: node scripts/validate-full-balance.mjs')
console.log('')
