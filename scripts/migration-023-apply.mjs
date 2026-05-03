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

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('FASE 5C.3B.4B-DB — Índice único para orders.layaway_id')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

// ========================================
// PASO 1: Verificar duplicados
// ========================================

console.log('PASO 1: Verificar duplicados en orders.layaway_id')
console.log('')

const { data: duplicates, error: duplicatesError } = await supabase.rpc('check_layaway_order_duplicates', {})

// Si RPC no existe, usar query directa
let duplicateRows = []
if (duplicatesError && duplicatesError.code === 'PGRST202') {
  console.log('⚠️  RPC no existe, usando query directa...')
  
  const { data: allOrders, error: ordersError } = await supabase
    .from('orders')
    .select('layaway_id')
    .not('layaway_id', 'is', null)
  
  if (ordersError) {
    console.error('❌ ERROR fetching orders:', ordersError)
    process.exit(1)
  }
  
  // Contar manualmente
  const counts = {}
  for (const order of allOrders) {
    const lid = order.layaway_id
    counts[lid] = (counts[lid] || 0) + 1
  }
  
  // Filtrar solo duplicados
  duplicateRows = Object.entries(counts)
    .filter(([lid, count]) => count > 1)
    .map(([layaway_id, order_count]) => ({ layaway_id, order_count }))
} else if (duplicatesError) {
  console.error('❌ ERROR checking duplicates:', duplicatesError)
  process.exit(1)
} else {
  duplicateRows = duplicates || []
}

console.log('Resultado:')
if (duplicateRows.length === 0) {
  console.log('✅ Sin duplicados (0 rows)')
  console.log('')
} else {
  console.log(`❌ DUPLICADOS ENCONTRADOS (${duplicateRows.length} layaway_ids):`)
  console.log('')
  for (const dup of duplicateRows) {
    console.log(`  - layaway_id: ${dup.layaway_id} → ${dup.order_count} orders`)
  }
  console.log('')
  console.log('🛑 DETENIENDO MIGRACIÓN')
  console.log('')
  console.log('ACCIÓN REQUERIDA:')
  console.log('1. Investigar manualmente por qué existen duplicados')
  console.log('2. Decidir cuál order conservar por cada layaway_id')
  console.log('3. Eliminar/corregir duplicados manualmente')
  console.log('4. Volver a ejecutar este script')
  console.log('')
  process.exit(1)
}

// ========================================
// PASO 2: Crear índice único parcial
// ========================================

console.log('PASO 2: Crear índice único parcial')
console.log('')

const createIndexSQL = `
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_layaway_id_unique 
ON orders(layaway_id) 
WHERE layaway_id IS NOT NULL;
`

const { error: createError } = await supabase.rpc('exec_sql', { sql: createIndexSQL })

// Si RPC no existe, intentar con SQL directo via REST
if (createError && createError.code === 'PGRST202') {
  console.log('⚠️  RPC exec_sql no existe, ejecutando con SQL directo...')
  
  // Crear índice usando SQL directo (esto puede requerir acceso directo a DB)
  console.log('SQL a ejecutar:')
  console.log(createIndexSQL)
  console.log('')
  console.log('⚠️  No puedo ejecutar DDL directamente desde Supabase JS client')
  console.log('Necesitas ejecutar este SQL manualmente en Supabase SQL Editor:')
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(createIndexSQL.trim())
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('Después de ejecutar, vuelve a correr este script para verificar.')
  process.exit(2)
} else if (createError) {
  console.error('❌ ERROR creating index:', createError)
  process.exit(1)
}

console.log('✅ Índice único creado (o ya existía)')
console.log('')

// ========================================
// PASO 3: Verificar índice único creado
// ========================================

console.log('PASO 3: Verificar índice único creado')
console.log('')

const { data: indexCheck, error: indexError } = await supabase.rpc('check_index', { 
  index_name: 'idx_orders_layaway_id_unique' 
})

// Si RPC no existe, consultar pg_indexes directamente (requiere permisos)
let indexExists = false
let indexDef = null

if (indexError && indexError.code === 'PGRST202') {
  console.log('⚠️  RPC check_index no existe')
  console.log('Necesitas verificar manualmente en Supabase SQL Editor:')
  console.log('')
  console.log('SELECT indexname, indexdef')
  console.log("FROM pg_indexes")
  console.log("WHERE tablename = 'orders'")
  console.log("  AND indexname = 'idx_orders_layaway_id_unique';")
  console.log('')
  console.log('Resultado esperado: 1 row con UNIQUE INDEX y WHERE layaway_id IS NOT NULL')
  console.log('')
} else if (indexError) {
  console.error('❌ ERROR checking index:', indexError)
  process.exit(1)
} else {
  indexExists = indexCheck && indexCheck.length > 0
  if (indexExists) {
    indexDef = indexCheck[0].indexdef
    console.log('✅ Índice encontrado:')
    console.log(`   ${indexDef}`)
    console.log('')
  } else {
    console.log('❌ Índice NO encontrado')
    console.log('')
    process.exit(1)
  }
}

// ========================================
// PASO 4: Eliminar índice viejo no-único
// ========================================

console.log('PASO 4: Eliminar índice viejo no-único (si existe)')
console.log('')

const dropOldIndexSQL = `DROP INDEX IF EXISTS idx_orders_layaway_id;`

const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropOldIndexSQL })

if (dropError && dropError.code === 'PGRST202') {
  console.log('⚠️  RPC exec_sql no existe')
  console.log('SQL a ejecutar manualmente en Supabase SQL Editor:')
  console.log('')
  console.log(dropOldIndexSQL)
  console.log('')
} else if (dropError) {
  console.error('❌ ERROR dropping old index:', dropError)
  process.exit(1)
} else {
  console.log('✅ Índice viejo eliminado (o no existía)')
  console.log('')
}

// ========================================
// PASO 5: Verificación final de índices
// ========================================

console.log('PASO 5: Verificación final de índices de layaway_id')
console.log('')

console.log('SQL de verificación manual:')
console.log('')
console.log('SELECT indexname, indexdef')
console.log('FROM pg_indexes')
console.log("WHERE tablename = 'orders'")
console.log("  AND indexdef ILIKE '%layaway_id%';")
console.log('')
console.log('Resultado esperado: Solo idx_orders_layaway_id_unique con UNIQUE y WHERE')
console.log('')

// ========================================
// RESUMEN FINAL
// ========================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('RESUMEN FINAL')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log('1. Duplicados en orders.layaway_id: 0 rows ✅')
console.log('2. Índice único creado: Verificar manualmente')
console.log('3. Índice viejo eliminado: Verificar manualmente')
console.log('4. No se borró ni modificó data: ✅ CONFIRMADO')
console.log('5. No se tocó webhook/UI/Stripe/checkout/admin: ✅ CONFIRMADO')
console.log('')
console.log('NOTA: Supabase JS client no puede ejecutar DDL directamente.')
console.log('Necesitas ejecutar los SQL manualmente en Supabase SQL Editor.')
console.log('')
console.log('SQL completo a ejecutar:')
console.log('')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('-- PASO 2: Crear índice único')
console.log('CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_layaway_id_unique')
console.log('ON orders(layaway_id)')
console.log('WHERE layaway_id IS NOT NULL;')
console.log('')
console.log('-- PASO 4: Eliminar índice viejo')
console.log('DROP INDEX IF EXISTS idx_orders_layaway_id;')
console.log('')
console.log('-- PASO 3: Verificar índice único')
console.log('SELECT indexname, indexdef')
console.log('FROM pg_indexes')
console.log("WHERE tablename = 'orders'")
console.log("  AND indexname = 'idx_orders_layaway_id_unique';")
console.log('')
console.log('-- PASO 5: Verificación final')
console.log('SELECT indexname, indexdef')
console.log('FROM pg_indexes')
console.log("WHERE tablename = 'orders'")
console.log("  AND indexdef ILIKE '%layaway_id%';")
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
