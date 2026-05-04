#!/usr/bin/env node
/**
 * ADMIN FASE 1A — Tests Validaciones Backend
 * Ejecuta 10 tests contra producción para validar reglas A, B, C, D
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://orhjnwpbzxyqtyrayvoi.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA'
const API_BASE = 'https://bagclue.vercel.app'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const results = []

function logTest(testNum, description, expected, actual, passed) {
  const result = {
    test: testNum,
    description,
    expected,
    actual,
    passed,
    timestamp: new Date().toISOString()
  }
  results.push(result)
  
  const icon = passed ? '✅' : '❌'
  console.log(`\n${icon} TEST ${testNum}: ${description}`)
  console.log(`Expected: ${expected}`)
  console.log(`Actual: ${actual}`)
  console.log(`Result: ${passed ? 'PASS' : 'FAIL'}`)
}

async function callShippingAPI(orderId, body) {
  const response = await fetch(`${API_BASE}/api/orders/${orderId}/shipping`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  
  const data = await response.json()
  return { status: response.status, data }
}

async function getOrCreateTestOrder(requirements) {
  // Intentar encontrar orden existente que cumpla requirements
  let query = supabase
    .from('orders')
    .select('*')
    .limit(1)
  
  if (requirements.payment_status) {
    query = query.eq('payment_status', requirements.payment_status)
  }
  
  if (requirements.shipping_address === 'NOT_NULL') {
    query = query.not('shipping_address', 'is', null)
  } else if (requirements.shipping_address === 'NULL') {
    query = query.is('shipping_address', null)
  }
  
  if (requirements.shipping_status) {
    query = query.eq('shipping_status', requirements.shipping_status)
  }
  
  const { data: orders } = await query
  
  if (orders && orders.length > 0) {
    console.log(`Using existing order: ${orders[0].id}`)
    return orders[0]
  }
  
  // Si no existe, crear orden de prueba
  console.log('Creating test order...')
  const { data: newOrder, error } = await supabase
    .from('orders')
    .insert({
      customer_name: 'Test Order - Admin Fase 1A',
      customer_email: 'test@bagclue.test',
      customer_phone: '+52 55 1234 5678',
      shipping_address: requirements.shipping_address === 'NOT_NULL' ? 'Calle Test 123, CDMX' : null,
      total: 100,
      currency: 'MXN',
      payment_status: requirements.payment_status || 'pending',
      shipping_status: requirements.shipping_status || 'pending',
      status: 'pending'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating test order:', error)
    return null
  }
  
  console.log(`Created test order: ${newOrder.id}`)
  return newOrder
}

async function resetOrderState(orderId, state) {
  await supabase
    .from('orders')
    .update(state)
    .eq('id', orderId)
}

async function runTests() {
  console.log('🧪 ADMIN FASE 1A - Tests Validaciones Backend')
  console.log('=' .repeat(60))
  
  // TEST 1: Order paid + address + provider + tracking → shipped PASS
  console.log('\n📋 TEST 1: Order paid + address + provider + tracking → shipped PASS')
  const order1 = await getOrCreateTestOrder({ 
    payment_status: 'paid', 
    shipping_address: 'NOT_NULL',
    shipping_status: 'pending'
  })
  
  if (order1) {
    await resetOrderState(order1.id, { 
      payment_status: 'paid',
      shipping_address: 'Calle Test 123, CDMX',
      shipping_status: 'pending',
      shipping_provider: null,
      tracking_number: null,
      shipped_at: null
    })
    
    const result = await callShippingAPI(order1.id, {
      shipping_status: 'shipped',
      shipping_provider: 'dhl',
      tracking_number: '1234567890'
    })
    
    const passed = result.status === 200 && result.data.success === true
    logTest(1, 'Paid + address + provider + tracking → shipped', 'Status 200, success=true', `Status ${result.status}, success=${result.data.success}`, passed)
  }
  
  // TEST 2: Shipped → delivered PASS
  console.log('\n📋 TEST 2: Shipped → delivered PASS')
  const order2 = await getOrCreateTestOrder({ 
    payment_status: 'paid',
    shipping_address: 'NOT_NULL',
    shipping_status: 'shipped'
  })
  
  if (order2) {
    await resetOrderState(order2.id, {
      payment_status: 'paid',
      shipping_address: 'Calle Test 123, CDMX',
      shipping_status: 'shipped',
      shipped_at: new Date().toISOString(),
      delivered_at: null
    })
    
    const result = await callShippingAPI(order2.id, {
      shipping_status: 'delivered'
    })
    
    const passed = result.status === 200 && result.data.success === true
    logTest(2, 'Shipped → delivered', 'Status 200, success=true', `Status ${result.status}, success=${result.data.success}`, passed)
  }
  
  // TEST 3: Shipped sin tracking → debe fallar
  console.log('\n📋 TEST 3: Shipped sin tracking → debe fallar')
  const order3 = await getOrCreateTestOrder({
    payment_status: 'paid',
    shipping_address: 'NOT_NULL',
    shipping_status: 'pending'
  })
  
  if (order3) {
    await resetOrderState(order3.id, {
      payment_status: 'paid',
      shipping_address: 'Calle Test 123, CDMX',
      shipping_status: 'pending',
      tracking_number: null
    })
    
    const result = await callShippingAPI(order3.id, {
      shipping_status: 'shipped',
      shipping_provider: 'dhl'
      // No tracking_number
    })
    
    const passed = result.status === 400 && result.data.error?.includes('tracking_number')
    logTest(3, 'Shipped sin tracking', 'Status 400, error contains "tracking_number"', `Status ${result.status}, error: ${result.data.error}`, passed)
  }
  
  // TEST 4: Shipped sin provider → debe fallar
  console.log('\n📋 TEST 4: Shipped sin provider → debe fallar')
  const order4 = await getOrCreateTestOrder({
    payment_status: 'paid',
    shipping_address: 'NOT_NULL',
    shipping_status: 'pending'
  })
  
  if (order4) {
    await resetOrderState(order4.id, {
      payment_status: 'paid',
      shipping_address: 'Calle Test 123, CDMX',
      shipping_status: 'pending',
      shipping_provider: null
    })
    
    const result = await callShippingAPI(order4.id, {
      shipping_status: 'shipped',
      tracking_number: '1234567890'
      // No shipping_provider
    })
    
    const passed = result.status === 400 && result.data.error?.includes('shipping_provider')
    logTest(4, 'Shipped sin provider', 'Status 400, error contains "shipping_provider"', `Status ${result.status}, error: ${result.data.error}`, passed)
  }
  
  // TEST 5: Shipped sin shipping_address → debe fallar
  console.log('\n📋 TEST 5: Shipped sin shipping_address → debe fallar')
  const order5 = await getOrCreateTestOrder({
    payment_status: 'paid',
    shipping_address: 'NULL',
    shipping_status: 'pending'
  })
  
  if (order5) {
    await resetOrderState(order5.id, {
      payment_status: 'paid',
      shipping_address: null,
      shipping_status: 'pending'
    })
    
    const result = await callShippingAPI(order5.id, {
      shipping_status: 'shipped',
      shipping_provider: 'dhl',
      tracking_number: '1234567890'
    })
    
    const passed = result.status === 400 && result.data.error?.includes('dirección')
    logTest(5, 'Shipped sin address', 'Status 400, error contains "dirección"', `Status ${result.status}, error: ${result.data.error}`, passed)
  }
  
  // TEST 6: Delivered si no está shipped → debe fallar
  console.log('\n📋 TEST 6: Delivered si no está shipped → debe fallar')
  const order6 = await getOrCreateTestOrder({
    payment_status: 'paid',
    shipping_address: 'NOT_NULL',
    shipping_status: 'pending'
  })
  
  if (order6) {
    await resetOrderState(order6.id, {
      payment_status: 'paid',
      shipping_address: 'Calle Test 123, CDMX',
      shipping_status: 'pending'
    })
    
    const result = await callShippingAPI(order6.id, {
      shipping_status: 'delivered'
    })
    
    const passed = result.status === 400 && result.data.error?.includes('enviado')
    logTest(6, 'Delivered sin shipped previo', 'Status 400, error contains "enviado"', `Status ${result.status}, error: ${result.data.error}`, passed)
  }
  
  // TEST 7: Unpaid order → no permite shipped
  console.log('\n📋 TEST 7: Unpaid order → no permite shipped')
  const order7 = await getOrCreateTestOrder({
    payment_status: 'pending',
    shipping_address: 'NOT_NULL',
    shipping_status: 'pending'
  })
  
  if (order7) {
    await resetOrderState(order7.id, {
      payment_status: 'pending',
      shipping_address: 'Calle Test 123, CDMX',
      shipping_status: 'pending'
    })
    
    const result = await callShippingAPI(order7.id, {
      shipping_status: 'shipped',
      shipping_provider: 'dhl',
      tracking_number: '1234567890'
    })
    
    const passed = result.status === 400 && result.data.error?.includes('pago')
    logTest(7, 'Unpaid → shipped', 'Status 400, error contains "pago"', `Status ${result.status}, error: ${result.data.error}`, passed)
  }
  
  // TEST 8: Unpaid order → no permite preparing
  console.log('\n📋 TEST 8: Unpaid order → no permite preparing')
  const order8 = await getOrCreateTestOrder({
    payment_status: 'pending',
    shipping_address: 'NOT_NULL',
    shipping_status: 'pending'
  })
  
  if (order8) {
    await resetOrderState(order8.id, {
      payment_status: 'pending',
      shipping_address: 'Calle Test 123, CDMX',
      shipping_status: 'pending'
    })
    
    const result = await callShippingAPI(order8.id, {
      shipping_status: 'preparing'
    })
    
    const passed = result.status === 400 && result.data.error?.includes('pago')
    logTest(8, 'Unpaid → preparing', 'Status 400, error contains "pago"', `Status ${result.status}, error: ${result.data.error}`, passed)
  }
  
  // TEST 9: Preparing sin address → debe fallar
  console.log('\n📋 TEST 9: Preparing sin address → debe fallar')
  const order9 = await getOrCreateTestOrder({
    payment_status: 'paid',
    shipping_address: 'NULL',
    shipping_status: 'pending'
  })
  
  if (order9) {
    await resetOrderState(order9.id, {
      payment_status: 'paid',
      shipping_address: null,
      shipping_status: 'pending'
    })
    
    const result = await callShippingAPI(order9.id, {
      shipping_status: 'preparing'
    })
    
    const passed = result.status === 400 && result.data.error?.includes('dirección')
    logTest(9, 'Preparing sin address', 'Status 400, error contains "dirección"', `Status ${result.status}, error: ${result.data.error}`, passed)
  }
  
  // TEST 10: Tracking URL auto-generada DHL
  console.log('\n📋 TEST 10: Tracking URL auto-generada DHL')
  const order10 = await getOrCreateTestOrder({
    payment_status: 'paid',
    shipping_address: 'NOT_NULL',
    shipping_status: 'pending'
  })
  
  if (order10) {
    await resetOrderState(order10.id, {
      payment_status: 'paid',
      shipping_address: 'Calle Test 123, CDMX',
      shipping_status: 'pending',
      tracking_url: null
    })
    
    const result = await callShippingAPI(order10.id, {
      shipping_status: 'shipped',
      shipping_provider: 'dhl',
      tracking_number: '1234567890'
      // No tracking_url (debe auto-generarse)
    })
    
    const expectedUrl = 'https://www.dhl.com.mx/es/express/rastreo.html?AWB=1234567890'
    const passed = result.status === 200 && result.data.order?.tracking_url === expectedUrl
    logTest(10, 'Auto-generate tracking_url DHL', `Status 200, tracking_url = "${expectedUrl}"`, `Status ${result.status}, tracking_url = "${result.data.order?.tracking_url}"`, passed)
  }
  
  // RESUMEN
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMEN DE TESTS')
  console.log('='.repeat(60))
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  
  console.log(`Total tests ejecutados: ${results.length}`)
  console.log(`✅ PASS: ${passed}`)
  console.log(`❌ FAIL: ${failed}`)
  
  if (failed === 0) {
    console.log('\n🎉 TODOS LOS TESTS PASARON')
  } else {
    console.log('\n⚠️ ALGUNOS TESTS FALLARON')
    console.log('\nTests fallidos:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - TEST ${r.test}: ${r.description}`)
    })
  }
  
  // Guardar resultados
  console.log('\n💾 Guardando resultados en ADMIN_FASE_1A_TESTS_RESULTS.json')
  const fs = await import('fs')
  fs.writeFileSync('ADMIN_FASE_1A_TESTS_RESULTS.json', JSON.stringify(results, null, 2))
}

runTests().catch(console.error)
