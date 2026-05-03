#!/usr/bin/env node
import Stripe from 'stripe'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-04-22.dahlia'
})

const session_id = 'cs_test_a1VX6NDjh1N1nIyqTeB8JoAhfBnZTmAQSxd7DHJFXqUXfZmVFjUfHRWZ3o'

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('BUSCANDO EVENT ID EN STRIPE')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log(`Session ID: ${session_id}`)
console.log('')

try {
  // Buscar eventos recientes de checkout.session.completed
  const events = await stripe.events.list({
    type: 'checkout.session.completed',
    limit: 100
  })

  console.log(`Total eventos checkout.session.completed: ${events.data.length}`)
  console.log('')

  // Buscar el evento que corresponde a nuestro session_id
  const targetEvent = events.data.find(event => {
    const session = event.data.object
    return session.id === session_id
  })

  if (targetEvent) {
    console.log('✅ EVENTO ENCONTRADO')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log(`Event ID: ${targetEvent.id}`)
    console.log(`Created: ${new Date(targetEvent.created * 1000).toISOString()}`)
    console.log(`Type: ${targetEvent.type}`)
    console.log(`API Version: ${targetEvent.api_version}`)
    console.log(`Livemode: ${targetEvent.livemode ? 'PROD' : 'TEST'}`)
    console.log('')
    console.log('Session Data:')
    console.log(`  session.id: ${targetEvent.data.object.id}`)
    console.log(`  payment_status: ${targetEvent.data.object.payment_status}`)
    console.log(`  amount_total: ${targetEvent.data.object.amount_total}`)
    console.log(`  currency: ${targetEvent.data.object.currency}`)
    console.log(`  payment_intent: ${targetEvent.data.object.payment_intent}`)
    console.log('')
    console.log('Metadata:')
    console.log(`  type: ${targetEvent.data.object.metadata?.type}`)
    console.log(`  layaway_id: ${targetEvent.data.object.metadata?.layaway_id}`)
    console.log(`  user_id: ${targetEvent.data.object.metadata?.user_id}`)
    console.log('')
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('WEBHOOK DELIVERY (requiere verificación manual en Dashboard)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('Para verificar HTTP response:')
    console.log(`1. Ir a: https://dashboard.stripe.com/test/events/${targetEvent.id}`)
    console.log('2. Scroll hasta sección "Webhooks"')
    console.log('3. Buscar endpoint: /api/stripe/webhook')
    console.log('4. Ver HTTP response code (esperado: 200)')
    console.log('')
  } else {
    console.log('❌ EVENTO NO ENCONTRADO')
    console.log('')
    console.log('Mostrando últimos 5 eventos para referencia:')
    console.log('')
    for (const event of events.data.slice(0, 5)) {
      const session = event.data.object
      console.log(`Event: ${event.id}`)
      console.log(`  Session: ${session.id}`)
      console.log(`  Amount: ${session.amount_total}`)
      console.log(`  Created: ${new Date(event.created * 1000).toISOString()}`)
      console.log(`  Metadata type: ${session.metadata?.type || 'none'}`)
      console.log('')
    }
  }

} catch (error) {
  console.error('❌ ERROR:', error.message)
  console.log('')
  console.log('Verificar manualmente en:')
  console.log('https://dashboard.stripe.com/test/events')
  console.log('')
  console.log('Filtrar por:')
  console.log(`- Type: checkout.session.completed`)
  console.log(`- Session ID: ${session_id}`)
  console.log(`- Fecha: 03 May 2026, ~10:20 UTC`)
  console.log(`- Amount: 84000 centavos (840.00 MXN)`)
}
