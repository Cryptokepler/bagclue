import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
const API_BASE = 'https://bagclue.vercel.app'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function callShippingAPI(orderId, body) {
  const response = await fetch(`${API_BASE}/api/orders/${orderId}/shipping`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return { status: response.status, data: await response.json() }
}

async function runRemainingTests() {
  console.log('🧪 Tests Restantes - Admin Fase 1A\n')
  
  // Usar orden existente paid
  const { data: paidOrders } = await supabase
    .from('orders')
    .select('*')
    .eq('payment_status', 'paid')
    .not('shipping_address', 'is', null)
    .limit(1)
  
  const paidOrder = paidOrders?.[0]
  
  if (!paidOrder) {
    console.log('❌ No hay órdenes paid con dirección para testing')
    return
  }
  
  console.log(`Using order: ${paidOrder.id}\n`)
  
  // TEST 3: Shipped sin tracking
  console.log('📋 TEST 3: Shipped sin tracking → debe fallar')
  await supabase.from('orders').update({ shipping_status: 'pending', tracking_number: null, shipping_provider: null }).eq('id', paidOrder.id)
  let result = await callShippingAPI(paidOrder.id, { shipping_status: 'shipped', shipping_provider: 'dhl' })
  console.log(`Result: ${result.status === 400 && result.data.error?.includes('tracking_number') ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Error: ${result.data.error}\n`)
  
  // TEST 4: Shipped sin provider
  console.log('📋 TEST 4: Shipped sin provider → debe fallar')
  await supabase.from('orders').update({ shipping_status: 'pending', tracking_number: null, shipping_provider: null }).eq('id', paidOrder.id)
  result = await callShippingAPI(paidOrder.id, { shipping_status: 'shipped', tracking_number: '1234567890' })
  console.log(`Result: ${result.status === 400 && result.data.error?.includes('shipping_provider') ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Error: ${result.data.error}\n`)
  
  // TEST 6: Delivered sin shipped previo
  console.log('📋 TEST 6: Delivered si no está shipped → debe fallar')
  await supabase.from('orders').update({ shipping_status: 'pending' }).eq('id', paidOrder.id)
  result = await callShippingAPI(paidOrder.id, { shipping_status: 'delivered' })
  console.log(`Result: ${result.status === 400 && result.data.error?.includes('enviado') ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Error: ${result.data.error}\n`)
  
  // TEST 7: Unpaid → shipped
  console.log('📋 TEST 7: Unpaid order → no permite shipped')
  await supabase.from('orders').update({ payment_status: 'pending', shipping_status: 'pending' }).eq('id', paidOrder.id)
  result = await callShippingAPI(paidOrder.id, { shipping_status: 'shipped', shipping_provider: 'dhl', tracking_number: '1234567890' })
  console.log(`Result: ${result.status === 400 && result.data.error?.includes('pago') ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Error: ${result.data.error}\n`)
  
  // TEST 8: Unpaid → preparing
  console.log('📋 TEST 8: Unpaid order → no permite preparing')
  await supabase.from('orders').update({ payment_status: 'pending', shipping_status: 'pending' }).eq('id', paidOrder.id)
  result = await callShippingAPI(paidOrder.id, { shipping_status: 'preparing' })
  console.log(`Result: ${result.status === 400 && result.data.error?.includes('pago') ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Error: ${result.data.error}\n`)
  
  // TEST 10: Tracking URL auto-generada
  console.log('📋 TEST 10: Tracking URL auto-generada DHL')
  await supabase.from('orders').update({ payment_status: 'paid', shipping_status: 'pending', tracking_url: null }).eq('id', paidOrder.id)
  result = await callShippingAPI(paidOrder.id, { shipping_status: 'shipped', shipping_provider: 'dhl', tracking_number: '1234567890' })
  const expectedUrl = 'https://www.dhl.com.mx/es/express/rastreo.html?AWB=1234567890'
  console.log(`Result: ${result.status === 200 && result.data.order?.tracking_url === expectedUrl ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Tracking URL: ${result.data.order?.tracking_url}`)
  
  // Restaurar orden
  await supabase.from('orders').update({ payment_status: 'paid', shipping_status: 'pending' }).eq('id', paidOrder.id)
}

runRemainingTests()
