// ═══════════════════════════════════════════════════════════════
// PAYMENTS MVP.2A — TEST 1: Crear Bank Transfer Order
// ═══════════════════════════════════════════════════════════════
// 
// INSTRUCCIONES:
// 1. Abrir https://bagclue.vercel.app/admin/productos
// 2. Buscar producto test "QA Bank Transfer Test" (o crearlo si no existe)
// 3. Anotar product_id (UUID del producto)
// 4. Abrir DevTools Console (F12)
// 5. Pegar este script completo
// 6. Reemplazar PRODUCT_TEST_ID con el UUID real
// 7. Ejecutar (Enter)
// 
// ═══════════════════════════════════════════════════════════════

// ⚠️ REEMPLAZAR ESTE UUID CON EL PRODUCT_ID REAL DEL TEST
const PRODUCT_TEST_ID = 'REEMPLAZAR-CON-UUID-REAL'

// ═══════════════════════════════════════════════════════════════
// PAYLOAD
// ═══════════════════════════════════════════════════════════════

const orderPayload = {
  items: [
    {
      product_id: PRODUCT_TEST_ID,
      quantity: 1
    }
  ],
  shipping_address: {
    name: 'QA Test User',
    phone: '5512345678',
    street: 'Calle Test 123',
    city: 'Ciudad de México',
    state: 'CDMX',
    postal_code: '01234',
    country: 'México'
  },
  customer: {
    email: 'qa-test@bagclue.com',
    name: 'QA Test User'
  }
}

// ═══════════════════════════════════════════════════════════════
// EJECUTAR REQUEST
// ═══════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════')
console.log('TEST 1: Crear Bank Transfer Order')
console.log('═══════════════════════════════════════════════════════════════')
console.log('')
console.log('📤 Enviando request a /api/payments/bank-transfer/order...')
console.log('')

fetch('/api/payments/bank-transfer/order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderPayload)
})
.then(response => {
  console.log('📊 Status:', response.status, response.statusText)
  return response.json()
})
.then(data => {
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('✅ RESPONSE RECIBIDO')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  
  // Mostrar datos sanitizados (sin CLABE completa)
  const sanitizedData = {
    success: data.success,
    order_id: data.order_id,
    tracking_token: data.tracking_token,
    transaction_id: data.transaction_id,
    payment_reference: data.payment_reference ? `****${data.payment_reference.slice(-4)}` : 'N/A',
    amount_mxn: data.amount_mxn,
    expires_at: data.expires_at,
    bank_config: {
      bank_name: data.bank_config?.bank_name,
      account_name: data.bank_config?.account_name,
      clabe_masked: data.bank_config?.clabe_masked, // Ya debe estar masked
      account_number_masked: data.bank_config?.account_number_masked,
      reference: data.bank_config?.reference ? `****${data.bank_config.reference.slice(-4)}` : 'N/A'
    }
  }
  
  console.log('📋 Datos Sanitizados:')
  console.log(JSON.stringify(sanitizedData, null, 2))
  console.log('')
  
  // Validaciones automáticas
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('🔍 VALIDACIONES AUTOMÁTICAS')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  
  const validations = {
    '1. Response exitoso': data.success === true,
    '2. order_id existe': !!data.order_id,
    '3. transaction_id existe': !!data.transaction_id,
    '4. payment_reference existe': !!data.payment_reference,
    '5. amount_mxn = 20': data.amount_mxn === 20,
    '6. expires_at existe': !!data.expires_at,
    '7. bank_config existe': !!data.bank_config,
    '8. clabe_masked correcto': data.bank_config?.clabe_masked?.includes('****'),
    '9. NO CLABE completa visible': !JSON.stringify(data).match(/\d{18}/), // 18 dígitos = CLABE
  }
  
  let allPass = true
  for (const [check, pass] of Object.entries(validations)) {
    const icon = pass ? '✅' : '❌'
    console.log(`${icon} ${check}: ${pass}`)
    if (!pass) allPass = false
  }
  
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('📝 SIGUIENTE PASO: VERIFICAR EN SUPABASE')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  console.log('Ir a Supabase Dashboard y verificar:')
  console.log('')
  console.log(`1. Tabla 'orders' → Buscar: id = ${sanitizedData.order_id}`)
  console.log('   - payment_method = bank_transfer')
  console.log('   - payment_status = pending')
  console.log('   - status = pending')
  console.log('')
  console.log(`2. Tabla 'order_items' → Buscar: order_id = ${sanitizedData.order_id}`)
  console.log('   - product_id correcto')
  console.log('   - quantity = 1')
  console.log('   - price_at_purchase = 20')
  console.log('   - product_snapshot existe')
  console.log('')
  console.log(`3. Tabla 'payment_transactions' → Buscar: id = ${sanitizedData.transaction_id}`)
  console.log('   - status = pending')
  console.log('   - amount_mxn = 20')
  console.log('   - payment_reference existe')
  console.log('   - expires_at ~24h')
  console.log('')
  console.log(`4. Tabla 'products' → Buscar: id = ${PRODUCT_TEST_ID}`)
  console.log('   - status cambió de available → reserved')
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(allPass ? '✅ VALIDACIONES INICIALES: PASS' : '❌ VALIDACIONES INICIALES: FAIL')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  console.log('⚠️ IMPORTANTE: Verificar manualmente en Supabase antes de continuar.')
  console.log('')
  
  // Guardar IDs para siguiente test
  window.TEST1_DATA = {
    product_id: PRODUCT_TEST_ID,
    order_id: data.order_id,
    transaction_id: data.transaction_id,
    payment_reference_partial: `****${data.payment_reference.slice(-4)}`,
    tracking_token: data.tracking_token
  }
  
  console.log('💾 IDs guardados en window.TEST1_DATA para siguiente test')
  console.log(window.TEST1_DATA)
})
.catch(error => {
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('❌ ERROR')
  console.log('═══════════════════════════════════════════════════════════════')
  console.error('Error:', error)
  console.log('')
  console.log('⚠️ DETENER QA — Reportar error exacto')
})
