#!/usr/bin/env node
/**
 * ADMIN FASE 1B.1 — Tests API GET /api/admin/envios
 * Ejecuta 15 tests contra producción
 */

const API_BASE = 'https://bagclue.vercel.app'

// NOTA: Para testing con auth admin, necesitamos cookie de sesión admin válida
// Como este es un test backend-only y la cookie es httpOnly, 
// vamos a probar los casos sin auth primero y luego manualmente con auth

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

async function callAPI(params = {}, headers = {}) {
  const queryString = new URLSearchParams(params).toString()
  const url = `${API_BASE}/api/admin/envios${queryString ? '?' + queryString : ''}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...headers
    }
  })
  
  const data = await response.json()
  return { status: response.status, data }
}

async function runTests() {
  console.log('🧪 ADMIN FASE 1B.1 - Tests API GET /api/admin/envios')
  console.log('=' .repeat(60))
  
  // ========================================
  // TEST 1: Sin auth admin → 401/403
  // ========================================
  console.log('\n📋 TEST 1: GET sin auth admin → 401/403')
  let result = await callAPI()
  let passed = result.status === 401 || result.status === 403
  logTest(1, 'Sin auth admin', 'Status 401 o 403', `Status ${result.status}`, passed)
  
  // ========================================
  // TESTS 2-15: Requieren auth admin
  // ========================================
  console.log('\n⚠️ TESTS 2-15 requieren auth admin válida')
  console.log('Para ejecutar estos tests, necesitas:')
  console.log('1. Hacer login en /admin/login')
  console.log('2. Obtener cookie bagclue_admin_session')
  console.log('3. Ejecutar tests con esa cookie')
  console.log('')
  console.log('Ejemplo manual con curl:')
  console.log('curl "https://bagclue.vercel.app/api/admin/envios?filter=all" \\')
  console.log('  -H "Cookie: bagclue_admin_session=<SESSION_COOKIE>"')
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMEN DE TESTS AUTOMATIZADOS')
  console.log('='.repeat(60))
  
  const passedCount = results.filter(r => r.passed).length
  const failedCount = results.filter(r => !r.passed).length
  
  console.log(`Total tests ejecutados automáticamente: ${results.length}`)
  console.log(`✅ PASS: ${passedCount}`)
  console.log(`❌ FAIL: ${failedCount}`)
  
  console.log('\n📝 TESTS MANUALES REQUERIDOS (2-15):')
  console.log('Estos tests deben ejecutarse manualmente con cookie admin:')
  console.log('2. GET con auth admin → 200')
  console.log('3. filter=all devuelve orders')
  console.log('4. filter=pending_address funciona')
  console.log('5. filter=pending_shipment funciona')
  console.log('6. filter=preparing funciona')
  console.log('7. filter=shipped funciona')
  console.log('8. filter=delivered funciona')
  console.log('9. search por email funciona')
  console.log('10. search por tracking_number funciona')
  console.log('11. stats devuelven números coherentes')
  console.log('12. pagination funciona')
  console.log('13. limit default = 25')
  console.log('14. limit max = 100 (si pones 200, debería limitarse a 100)')
  console.log('15. No se tocó UI ni áreas prohibidas')
  
  console.log('\n💡 INSTRUCCIONES PARA TESTS MANUALES:')
  console.log('1. Abre https://bagclue.vercel.app/admin/login en navegador')
  console.log('2. Haz login con credenciales admin')
  console.log('3. Abre DevTools → Application → Cookies')
  console.log('4. Copia valor de "bagclue_admin_session"')
  console.log('5. Ejecuta:')
  console.log('   export ADMIN_COOKIE="<valor_copiado>"')
  console.log('   curl "https://bagclue.vercel.app/api/admin/envios?filter=all" \\')
  console.log('     -H "Cookie: bagclue_admin_session=$ADMIN_COOKIE"')
}

runTests().catch(console.error)
