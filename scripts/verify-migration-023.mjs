#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('VERIFICACIÓN POST-MIGRACIÓN 023')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

let allTestsPassed = true

// ========================================
// TEST 1: Verificar duplicados (debe ser 0)
// ========================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('TEST 1: Verificar duplicados en orders.layaway_id')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

const { data: allOrders, error: ordersError } = await supabase
  .from('orders')
  .select('layaway_id')
  .not('layaway_id', 'is', null)

if (ordersError) {
  console.error('❌ ERROR fetching orders:', ordersError)
  allTestsPassed = false
} else {
  const counts = {}
  for (const order of allOrders) {
    const lid = order.layaway_id
    counts[lid] = (counts[lid] || 0) + 1
  }
  
  const duplicates = Object.entries(counts).filter(([lid, count]) => count > 1)
  
  if (duplicates.length === 0) {
    console.log('✅ PASS: Sin duplicados (0 rows)')
    console.log('')
  } else {
    console.log(`❌ FAIL: ${duplicates.length} duplicados encontrados`)
    for (const [layaway_id, order_count] of duplicates) {
      console.log(`   - ${layaway_id}: ${order_count} orders`)
    }
    console.log('')
    allTestsPassed = false
  }
}

// ========================================
// TEST 2-5: Requieren ejecución manual en Supabase SQL Editor
// ========================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('TESTS 2-5: Verificación manual en Supabase SQL Editor')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log('Ejecuta las siguientes queries en Supabase SQL Editor y reporta resultados:')
console.log('')

console.log('-- TEST 2: Verificar idx_orders_layaway_id_unique existe')
console.log('SELECT indexname, indexdef')
console.log('FROM pg_indexes')
console.log("WHERE tablename = 'orders'")
console.log("  AND indexname = 'idx_orders_layaway_id_unique';")
console.log('')
console.log('Resultado esperado: 1 row con:')
console.log('  - indexdef contiene "UNIQUE INDEX"')
console.log('  - indexdef contiene "WHERE (layaway_id IS NOT NULL)"')
console.log('')

console.log('-- TEST 3: Verificar idx_orders_layaway_id fue eliminado')
console.log('SELECT COUNT(*) as old_index_count')
console.log('FROM pg_indexes')
console.log("WHERE tablename = 'orders'")
console.log("  AND indexname = 'idx_orders_layaway_id';")
console.log('')
console.log('Resultado esperado: old_index_count = 0')
console.log('')

console.log('-- TEST 4: Listar todos los índices de layaway_id')
console.log('SELECT indexname, indexdef')
console.log('FROM pg_indexes')
console.log("WHERE tablename = 'orders'")
console.log("  AND indexdef ILIKE '%layaway_id%';")
console.log('')
console.log('Resultado esperado: Solo 1 row (idx_orders_layaway_id_unique)')
console.log('')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('RESUMEN VERIFICACIÓN')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log(`TEST 1 (Duplicados): ${allTestsPassed ? '✅ PASS' : '❌ FAIL'}`)
console.log('TEST 2-5 (Índices): ⏸️ Verificación manual requerida')
console.log('')
