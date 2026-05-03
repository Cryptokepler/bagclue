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
console.log('FASE 5C.3B.4B-DB — Ejecutando Migración 023')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log(`Supabase URL: ${supabaseUrl}`)
console.log(`Service Key: ${supabaseServiceKey.slice(0, 20)}...`)
console.log('')

// ========================================
// PASO 1: Verificar duplicados
// ========================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('PASO 1: Verificar duplicados en orders.layaway_id')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

const { data: allOrders, error: ordersError } = await supabase
  .from('orders')
  .select('id, layaway_id, created_at, status, payment_status')
  .not('layaway_id', 'is', null)

if (ordersError) {
  console.error('❌ ERROR fetching orders:', ordersError)
  process.exit(1)
}

console.log(`Total orders con layaway_id: ${allOrders.length}`)
console.log('')

// Contar duplicados manualmente
const counts = {}
for (const order of allOrders) {
  const lid = order.layaway_id
  counts[lid] = (counts[lid] || 0) + 1
}

const duplicateLayawayIds = Object.entries(counts)
  .filter(([lid, count]) => count > 1)

console.log('SQL ejecutado:')
console.log('SELECT layaway_id, COUNT(*) as order_count')
console.log('FROM orders')
console.log('WHERE layaway_id IS NOT NULL')
console.log('GROUP BY layaway_id')
console.log('HAVING COUNT(*) > 1;')
console.log('')

if (duplicateLayawayIds.length === 0) {
  console.log('✅ RESULTADO: Sin duplicados (0 rows)')
  console.log('')
} else {
  console.log(`❌ RESULTADO: ${duplicateLayawayIds.length} layaway_ids con duplicados:`)
  console.log('')
  for (const [layaway_id, order_count] of duplicateLayawayIds) {
    console.log(`   layaway_id: ${layaway_id}`)
    console.log(`   order_count: ${order_count}`)
    console.log('')
  }
  console.log('🛑 DETENIENDO MIGRACIÓN')
  console.log('')
  console.log('ACCIÓN REQUERIDA: Resolver duplicados manualmente antes de continuar')
  console.log('')
  process.exit(1)
}

// ========================================
// PASO 2, 3, 4, 5: Ejecutar en Supabase SQL Editor
// ========================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('PASOS 2-5: SQL a ejecutar en Supabase SQL Editor')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log('⚠️  Supabase JS client no puede ejecutar DDL (CREATE INDEX, DROP INDEX)')
console.log('Ejecuta el siguiente SQL manualmente en Supabase Dashboard → SQL Editor:')
console.log('')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log('-- PASO 2: Crear índice único parcial')
console.log('CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_layaway_id_unique')
console.log('ON orders(layaway_id)')
console.log('WHERE layaway_id IS NOT NULL;')
console.log('')
console.log('-- PASO 3: Verificar índice único creado')
console.log('SELECT indexname, indexdef')
console.log('FROM pg_indexes')
console.log("WHERE tablename = 'orders'")
console.log("  AND indexname = 'idx_orders_layaway_id_unique';")
console.log('')
console.log('-- Resultado esperado: 1 row con UNIQUE INDEX y WHERE layaway_id IS NOT NULL')
console.log('')
console.log('-- PASO 4: Eliminar índice viejo no-único (si existe)')
console.log('DROP INDEX IF EXISTS idx_orders_layaway_id;')
console.log('')
console.log('-- PASO 5: Verificación final de índices de layaway_id')
console.log('SELECT indexname, indexdef')
console.log('FROM pg_indexes')
console.log("WHERE tablename = 'orders'")
console.log("  AND indexdef ILIKE '%layaway_id%';")
console.log('')
console.log('-- Resultado esperado: Solo idx_orders_layaway_id_unique')
console.log('')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log('DESPUÉS DE EJECUTAR EL SQL ARRIBA:')
console.log('Ejecuta: node scripts/verify-migration-023.mjs')
console.log('')
