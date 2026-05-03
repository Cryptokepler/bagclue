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

async function main() {
  const email = 'jhonatanvenegas@usdtcapital.es'
  const userId = '9b37d6cc-0b45-4a39-8226-d3022606fcd8'
  
  console.log('Generando token de autenticación para:', email)
  
  // Generar token usando admin API
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email
  })
  
  if (error) {
    console.error('Error:', error.message)
    
    // Alternativa: crear token manualmente con service role
    console.log('\nUsando service role para simular usuario...')
    console.log('Service role key:', supabaseServiceKey.substring(0, 20) + '...')
    process.exit(0)
  }
  
  console.log('\nLink generado:', data.properties.action_link)
  
  // Extraer token del link
  const url = new URL(data.properties.action_link)
  const token = url.hash.substring(1).split('&').find(p => p.startsWith('access_token=')).split('=')[1]
  
  console.log('\nAccess token:')
  console.log(token)
  console.log('\nPuedes usar este token para probar el endpoint:')
  console.log(`curl -X POST -H "Authorization: Bearer ${token}" https://bagclue.vercel.app/api/layaways/aaaaaaaa-bbbb-cccc-dddd-000000000001/pay-balance`)
}

main().catch(console.error)
