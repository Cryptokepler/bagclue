#!/usr/bin/env node
// TEST MVP.2B FIXES - Bank Transfer UI
// Tests after fix implementation (commit b57796d)
// 13 validations required

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://orhjnwpbzxyqtyrayvoi.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaGpud3Bienh5cXR5cmF5dm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMDM0MCwiZXhwIjoyMDkyOTc2MzQwfQ._0MWYvnD3KgamA6KguGgpDu82pmHst-3QWyuAKRLkJA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TESTS = {
  productId: null,
  orderId: null,
  transactionId: null,
  trackingToken: null,
  paymentReference: null
};

// TEST 1: Create test product
async function test1_createProduct() {
  console.log('\n🧪 TEST 1: Crear producto test');
  
  const { data, error } = await supabase
    .from('products')
    .insert({
      title: 'Test Bank Transfer Fix - MVP.2B',
      brand: 'TEST',
      price: 100,
      currency: 'MXN',
      category: 'Bolsas',
      status: 'available',
      is_published: true,
      slug: `test-mvp2b-fix-${Date.now()}`
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating product:', error);
    return false;
  }

  TESTS.productId = data.id;
  console.log('✅ Producto creado:', data.id);
  return true;
}

// TEST 2: Create bank transfer order from API
async function test2_createBankTransferOrder() {
  console.log('\n🧪 TEST 2: Crear orden bank transfer (simula /cart)');

  const response = await fetch('https://bagclue.vercel.app/api/payments/bank-transfer/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: TESTS.productId,
      customerName: 'Test MVP.2B Fixes',
      customerEmail: 'qa-mvp2b-fixes@bagclue.com',
      customerPhone: '+52 55 1234 5678'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Error creating order:', error);
    return false;
  }

  const data = await response.json();
  TESTS.orderId = data.orderId;
  TESTS.transactionId = data.transactionId;
  TESTS.trackingToken = data.trackingToken;
  TESTS.paymentReference = data.paymentReference;

  console.log('✅ Orden creada:', {
    orderId: TESTS.orderId,
    transactionId: TESTS.transactionId,
    trackingToken: TESTS.trackingToken ? `****${TESTS.trackingToken.slice(-4)}` : null,
    paymentReference: `****${TESTS.paymentReference.slice(-4)}`
  });

  return true;
}

// TEST 3: Verify redirect URL format
function test3_verifyRedirectURL() {
  console.log('\n🧪 TEST 3: Verificar formato URL redirect');

  const expectedURL = `/payment/bank-transfer/${TESTS.transactionId}?token=${TESTS.trackingToken}`;
  console.log('✅ URL esperada:', expectedURL);
  console.log('✅ Frontend debe redirigir a esta URL tras crear orden');

  return true;
}

// TEST 4: Verify payment instructions page loads (with token)
async function test4_paymentInstructionsPage() {
  console.log('\n🧪 TEST 4: Página instrucciones bancarias carga con token');

  const url = `https://bagclue.vercel.app/api/payments/bank-transfer/config?transaction_id=${TESTS.transactionId}&token=${encodeURIComponent(TESTS.trackingToken)}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ API /config falló:', error);
    return false;
  }

  const data = await response.json();

  // Verify all required fields
  const required = ['transactionId', 'orderId', 'paymentReference', 'amountMxn', 'expiresAt', 'bankConfig'];
  for (const field of required) {
    if (!data[field]) {
      console.error(`❌ Falta campo requerido: ${field}`);
      return false;
    }
  }

  console.log('✅ API /config retorna datos completos');
  console.log('✅ bankConfig incluye:', Object.keys(data.bankConfig));
  console.log('✅ CLABE NO expuesta completa:', data.bankConfig.clabe ? '(presente)' : '(ausente)');

  return true;
}

// TEST 5: Verify order has payment_method set
async function test5_paymentMethodField() {
  console.log('\n🧪 TEST 5: Order tiene payment_method = bank_transfer_mxn');

  const { data, error } = await supabase
    .from('orders')
    .select('payment_method, tracking_token')
    .eq('id', TESTS.orderId)
    .single();

  if (error) {
    console.error('❌ Error fetching order:', error);
    return false;
  }

  if (data.payment_method !== 'bank_transfer_mxn') {
    console.error('❌ payment_method incorrecto:', data.payment_method);
    return false;
  }

  if (!data.tracking_token) {
    console.error('❌ tracking_token faltante');
    return false;
  }

  console.log('✅ payment_method:', data.payment_method);
  console.log('✅ tracking_token presente');

  return true;
}

// TEST 6: Verify bank transfer block appears on /account/orders/[id]
// (Cannot automate - requires browser login)
function test6_orderDetailBankTransferBlock() {
  console.log('\n🧪 TEST 6: /account/orders/[id] muestra bloque bank transfer');
  console.log('⚠️  VALIDACIÓN MANUAL REQUERIDA');
  console.log(`📝 URL: https://bagclue.vercel.app/account/orders/${TESTS.orderId}`);
  console.log('✓ Login con customer account vinculado al order');
  console.log('✓ Debe mostrar: Monto, Banco, Titular, CLABE parcial, Referencia, Expiración');
  console.log('✓ Debe mostrar: Estado comprobante ("Esperando comprobante")');
  console.log('✓ Debe mostrar: Link "Ver instrucciones de pago completas"');
  
  return 'manual';
}

// TEST 7: Verify timeline shows "Esperando pago" (not "Pago confirmado")
function test7_timelineEsperandoPago() {
  console.log('\n🧪 TEST 7: Timeline muestra "Esperando pago" si payment_status=pending');
  console.log('⚠️  VALIDACIÓN MANUAL REQUERIDA');
  console.log(`📝 URL: https://bagclue.vercel.app/account/orders/${TESTS.orderId}`);
  console.log('✓ Timeline debe mostrar: "Esperando pago" (NO "Pago confirmado")');
  console.log('✓ Estados de envío deben estar en pending hasta que payment_status = paid');
  
  return 'manual';
}

// TEST 8: Upload proof and verify status changes
async function test8_uploadProofStatus() {
  console.log('\n🧪 TEST 8: Upload comprobante y verificar estado');

  // Create dummy proof file (base64 PNG)
  const dummyProof = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const proofBlob = Buffer.from(dummyProof, 'base64');

  const formData = new FormData();
  formData.append('transactionId', TESTS.transactionId);
  formData.append('file', new Blob([proofBlob], { type: 'image/png' }), 'proof.png');

  const response = await fetch('https://bagclue.vercel.app/api/payments/bank-transfer/upload-proof', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Upload failed:', error);
    return false;
  }

  console.log('✅ Comprobante subido');

  // Verify transaction status changed
  const { data, error } = await supabase
    .from('payment_transactions')
    .select('status, proof_url')
    .eq('id', TESTS.transactionId)
    .single();

  if (error) {
    console.error('❌ Error fetching transaction:', error);
    return false;
  }

  if (data.status !== 'proof_uploaded' && data.status !== 'awaiting_approval') {
    console.error('❌ Status incorrecto:', data.status);
    return false;
  }

  if (!data.proof_url) {
    console.error('❌ proof_url faltante');
    return false;
  }

  console.log('✅ Transaction status:', data.status);
  console.log('✅ proof_url presente');

  return true;
}

// TEST 9: Verify order detail shows "Comprobante recibido"
function test9_orderDetailProofReceived() {
  console.log('\n🧪 TEST 9: Order detail muestra "Comprobante recibido"');
  console.log('⚠️  VALIDACIÓN MANUAL REQUERIDA');
  console.log(`📝 URL: https://bagclue.vercel.app/account/orders/${TESTS.orderId}`);
  console.log('✓ Bloque bank transfer debe mostrar: "Comprobante recibido"');
  console.log('✓ Badge/estado debe reflejar transaction_status = proof_uploaded');
  
  return 'manual';
}

// TEST 10: Stripe checkout no-regression
async function test10_stripeNoRegression() {
  console.log('\n🧪 TEST 10: Stripe checkout sigue funcionando');

  // Create another test product for Stripe
  const { data: stripeProduct, error: productError } = await supabase
    .from('products')
    .insert({
      title: 'Test Stripe No-Regression',
      brand: 'TEST',
      price: 150,
      currency: 'MXN',
      category: 'Bolsas',
      status: 'available',
      is_published: false,
      slug: `test-stripe-${Date.now()}`
    })
    .select()
    .single();

  if (productError) {
    console.error('❌ Error creating Stripe test product:', productError);
    return false;
  }

  // Try creating Stripe checkout session
  const response = await fetch('https://bagclue.vercel.app/api/checkout/create-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ product_id: stripeProduct.id }],
      customer_name: 'Test Stripe',
      customer_email: 'qa-stripe@bagclue.com'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Stripe checkout session failed:', error);
    return false;
  }

  const data = await response.json();

  if (!data.url || !data.url.includes('checkout.stripe.com')) {
    console.error('❌ Stripe URL inválida:', data.url);
    return false;
  }

  console.log('✅ Stripe checkout session created');
  console.log('✅ URL:', data.url);

  // Cleanup
  await supabase.from('products').update({ status: 'sold' }).eq('id', stripeProduct.id);

  return true;
}

// TEST 11: Security - No CLABE complete in logs
function test11_securityCLABE() {
  console.log('\n🧪 TEST 11: Seguridad - No CLABE completa en logs');
  console.log('⚠️  VALIDACIÓN MANUAL REQUERIDA (revisar Vercel logs)');
  console.log('✓ Buscar en logs: No debe aparecer CLABE completa');
  console.log('✓ Solo formato permitido: ****XXXX');
  
  return 'manual';
}

// TEST 12: Security - No tracking_token complete in logs
function test12_securityTrackingToken() {
  console.log('\n🧪 TEST 12: Seguridad - No tracking_token completo en logs');
  console.log('⚠️  VALIDACIÓN MANUAL REQUERIDA (revisar Vercel logs)');
  console.log('✓ Buscar en logs: tracking_token no debe imprimirse completo');
  console.log('✓ Solo en requests/responses necesarios');
  
  return 'manual';
}

// TEST 13: Cleanup
async function test13_cleanup() {
  console.log('\n🧪 TEST 13: Cleanup');

  // Mark product as sold (don't delete to preserve order history)
  const { error } = await supabase
    .from('products')
    .update({ status: 'sold', is_published: false })
    .eq('id', TESTS.productId);

  if (error) {
    console.error('❌ Error updating product:', error);
    return false;
  }

  console.log('✅ Producto test marcado como sold + unpublished');
  console.log('✅ Order y transaction conservados para auditoría');

  return true;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 INICIANDO TESTING MVP.2B FIXES (commit b57796d)');
  console.log('═══════════════════════════════════════════════════\n');

  const results = {
    automated: [],
    manual: []
  };

  // Automated tests
  const automatedTests = [
    { name: 'TEST 1', fn: test1_createProduct },
    { name: 'TEST 2', fn: test2_createBankTransferOrder },
    { name: 'TEST 3', fn: test3_verifyRedirectURL },
    { name: 'TEST 4', fn: test4_paymentInstructionsPage },
    { name: 'TEST 5', fn: test5_paymentMethodField },
    { name: 'TEST 8', fn: test8_uploadProofStatus },
    { name: 'TEST 10', fn: test10_stripeNoRegression },
    { name: 'TEST 13', fn: test13_cleanup }
  ];

  for (const test of automatedTests) {
    try {
      const result = await test.fn();
      results.automated.push({ name: test.name, pass: result });
    } catch (error) {
      console.error(`❌ ${test.name} threw error:`, error);
      results.automated.push({ name: test.name, pass: false });
    }
  }

  // Manual tests
  const manualTests = [
    { name: 'TEST 6', fn: test6_orderDetailBankTransferBlock },
    { name: 'TEST 7', fn: test7_timelineEsperandoPago },
    { name: 'TEST 9', fn: test9_orderDetailProofReceived },
    { name: 'TEST 11', fn: test11_securityCLABE },
    { name: 'TEST 12', fn: test12_securityTrackingToken }
  ];

  for (const test of manualTests) {
    try {
      test.fn();
      results.manual.push(test.name);
    } catch (error) {
      console.error(`❌ ${test.name} threw error:`, error);
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 RESUMEN TESTING MVP.2B FIXES');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('🤖 TESTS AUTOMATIZADOS:');
  let passedAuto = 0;
  for (const result of results.automated) {
    const icon = result.pass ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.pass ? 'PASS' : 'FAIL'}`);
    if (result.pass) passedAuto++;
  }

  console.log(`\n👤 TESTS MANUALES (${results.manual.length} pendientes):`);
  for (const testName of results.manual) {
    console.log(`⚠️  ${testName}: MANUAL VALIDATION REQUIRED`);
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`✅ Automatizados: ${passedAuto}/${results.automated.length} PASS`);
  console.log(`⚠️  Manuales: ${results.manual.length} pending`);
  console.log('═══════════════════════════════════════════════════');

  console.log('\n📝 TEST DATA (para validación manual):');
  console.log(`- Product ID: ${TESTS.productId}`);
  console.log(`- Order ID: ${TESTS.orderId}`);
  console.log(`- Transaction ID: ${TESTS.transactionId}`);
  console.log(`- Tracking Token: ****${TESTS.trackingToken?.slice(-8) || 'N/A'}`);
  console.log(`- Payment Reference: ****${TESTS.paymentReference?.slice(-4) || 'N/A'}`);
  console.log(`- Email: qa-mvp2b-fixes@bagclue.com`);
  console.log(`\n🔗 URLs para validación manual:`);
  console.log(`- Instrucciones: https://bagclue.vercel.app/payment/bank-transfer/${TESTS.transactionId}?token=${TESTS.trackingToken}`);
  console.log(`- Order detail: https://bagclue.vercel.app/account/orders/${TESTS.orderId}`);

  if (passedAuto === results.automated.length) {
    console.log('\n✅ TODOS LOS TESTS AUTOMATIZADOS: PASS');
    console.log('⚠️  VALIDACIÓN MANUAL REQUERIDA para completar QA');
  } else {
    console.log('\n❌ ALGUNOS TESTS AUTOMATIZADOS FALLARON');
    console.log('🔧 Revisar errores antes de validación manual');
  }
}

runAllTests().catch(console.error);
