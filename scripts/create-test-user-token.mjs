#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Cliente con anon key para auth de usuario
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
  const email = 'jhonatanvenegas@usdtcapital.es'
  const password = 'test-password-temp-12345' // Temporal
  
  console.log('Intentando obtener token para:', email)
  
  // Intentar sign in primero
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  })
  
  if (!signInError && signInData.session) {
    console.log('✅ Login exitoso')
    console.log('\nAccess token:')
    console.log(signInData.session.access_token)
    console.log('\nPuedes usar este token para probar el endpoint.')
    return
  }
  
  console.log('⚠️  No se pudo hacer login (usuario no tiene password):', signInError?.message)
  console.log('\nOPCIONES:')
  console.log('1. Ir a https://bagclue.vercel.app/account/login')
  console.log('2. Ingresar con email:', email)
  console.log('3. Abrir DevTools → Console')
  console.log('4. Ejecutar:')
  console.log('   const { data: { session } } = await supabaseCustomer.auth.getSession()')
  console.log('   console.log(session.access_token)')
  console.log('5. Copiar el token y ejecutar:')
  console.log(`   curl -X POST -H "Authorization: Bearer [TOKEN]" https://bagclue.vercel.app/api/layaways/aaaaaaaa-bbbb-cccc-dddd-000000000001/pay-balance`)
}

main().catch(console.error)
