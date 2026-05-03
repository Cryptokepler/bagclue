# FASE 5C.3B.4B — PROPUESTA: WEBHOOK SALDO COMPLETO ATÓMICO

**Fecha:** 2026-05-03  
**Status:** 📋 **PROPUESTA TÉCNICA - NO IMPLEMENTADO**

---

## ⚠️ DECLARACIÓN ABSOLUTA

### ❌ NADA HA SIDO IMPLEMENTADO

- ❌ NO se tocó código
- ❌ NO se tocó webhook
- ❌ NO se tocó base de datos
- ❌ NO se tocó Stripe
- ❌ NO se tocó UI
- ❌ NO se ejecutó ningún SQL
- ❌ NO se aplicaron migraciones
- ❌ NO se crearon funciones
- ❌ NO se modificaron archivos

**Este documento es SOLO propuesta técnica para revisión y aprobación.**

---

## 1. ORDEN EXACTO DE OPERACIONES

### FASE 1: VALIDACIÓN INICIAL (Checks rápidos)

**1.1. Validar evento Stripe**
```javascript
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
if (!event) {
  console.error('[WEBHOOK] Invalid signature')
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
}
```

**1.2. Validar metadata completa**
```javascript
const metadata = session.metadata
const required = ['type', 'layaway_id', 'user_id', 'customer_email', 'balance_amount', 'payments_remaining', 'total_amount', 'amount_paid_before']

for (const field of required) {
  if (!metadata[field]) {
    console.error(`[WEBHOOK] Missing metadata.${field}`)
    return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 })
  }
}

if (metadata.type !== 'layaway_full_balance') {
  return // Not our handler
}
```

**1.3. Validar payment_status**
```javascript
if (session.payment_status !== 'paid') {
  console.error('[WEBHOOK] Session not paid:', session.payment_status)
  return NextResponse.json({ error: 'Session not paid' }, { status: 400 })
}
```

---

### FASE 2: IDEMPOTENCIA (Checks antes de procesar)

**2.1. Buscar layaway**
```javascript
const { data: layaway, error: fetchError } = await supabaseAdmin
  .from('layaways')
  .select('*')
  .eq('id', metadata.layaway_id)
  .single()

if (fetchError || !layaway) {
  console.error('[WEBHOOK] Layaway not found')
  return NextResponse.json({ error: 'Layaway not found' }, { status: 404 })
}
```

**2.2. CHECK IDEMPOTENCIA #1: Layaway ya completed**
```javascript
if (layaway.status === 'completed') {
  console.log('[WEBHOOK] ✓ Layaway already completed (IDEMPOTENT)')
  
  // Verificar que tiene order
  if (layaway.order_id) {
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id, tracking_token')
      .eq('id', layaway.order_id)
      .single()
    
    if (existingOrder) {
      console.log('[WEBHOOK] ✓ Order already exists:', existingOrder.id)
      return NextResponse.json({ received: true, idempotent: true }, { status: 200 })
    }
  }
  
  // Si está completed pero sin order, continuar para crear order
  console.warn('[WEBHOOK] ⚠️ Layaway completed but missing order, will create')
}
```

**2.3. CHECK IDEMPOTENCIA #2: Order ya existe para este layaway**
```javascript
if (layaway.order_id) {
  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id, status, payment_status')
    .eq('id', layaway.order_id)
    .single()
  
  if (existingOrder && existingOrder.payment_status === 'paid') {
    console.log('[WEBHOOK] ✓ Order already exists and paid (IDEMPOTENT)')
    return NextResponse.json({ received: true, idempotent: true }, { status: 200 })
  }
}
```

**2.4. CHECK IDEMPOTENCIA #3: Verificar si cuotas ya están paid**
```javascript
const { data: allPayments } = await supabaseAdmin
  .from('layaway_payments')
  .select('id, payment_number, status, stripe_session_id')
  .eq('layaway_id', metadata.layaway_id)
  .order('payment_number', { ascending: true })

const pendingPayments = allPayments.filter(p => p.status === 'pending' || p.status === 'overdue')

if (pendingPayments.length === 0) {
  console.log('[WEBHOOK] ✓ All payments already paid (IDEMPOTENT)')
  
  // Verificar si todas tienen el mismo session_id
  const paidByThisSession = allPayments.filter(p => p.stripe_session_id === session.id)
  
  if (paidByThisSession.length > 0) {
    console.log('[WEBHOOK] ✓ Payments already processed by this session (IDEMPOTENT)')
    
    // Continuar para asegurar que order existe
    if (!layaway.order_id) {
      console.warn('[WEBHOOK] ⚠️ Payments paid but order missing, will create')
    } else {
      return NextResponse.json({ received: true, idempotent: true }, { status: 200 })
    }
  }
}
```

---

### FASE 3: VALIDACIONES DE SEGURIDAD

**3.1. Validar ownership**
```javascript
const ownsLayaway = 
  layaway.user_id === metadata.user_id || 
  layaway.customer_email === metadata.customer_email

if (!ownsLayaway) {
  console.error('[WEBHOOK] Ownership mismatch:', {
    layaway_user_id: layaway.user_id,
    layaway_email: layaway.customer_email,
    metadata_user_id: metadata.user_id,
    metadata_email: metadata.customer_email
  })
  return NextResponse.json({ error: 'Ownership mismatch' }, { status: 403 })
}
```

**3.2. Validar estado del layaway**
```javascript
const validStatuses = ['active', 'overdue', 'completed']
if (!validStatuses.includes(layaway.status)) {
  console.error('[WEBHOOK] Invalid layaway status:', layaway.status)
  return NextResponse.json({ error: 'Invalid layaway status' }, { status: 400 })
}
```

**3.3. Validar amount_remaining**
```javascript
const expectedAmountMXN = parseFloat(metadata.balance_amount)
const stripeAmountMXN = (session.amount_total || 0) / 100  // Stripe usa centavos
const tolerance = 1  // $1 MXN tolerancia

if (Math.abs(stripeAmountMXN - expectedAmountMXN) > tolerance) {
  console.error('[WEBHOOK] Amount mismatch:', {
    expected: expectedAmountMXN,
    stripe_charged: stripeAmountMXN,
    difference: Math.abs(stripeAmountMXN - expectedAmountMXN)
  })
  // Loggear pero continuar (Stripe es fuente de verdad)
}

// Validar contra layaway.amount_remaining
if (layaway.amount_remaining && Math.abs(layaway.amount_remaining - expectedAmountMXN) > tolerance) {
  console.warn('[WEBHOOK] Layaway amount_remaining mismatch:', {
    layaway_amount_remaining: layaway.amount_remaining,
    metadata_balance_amount: expectedAmountMXN
  })
}
```

**3.4. Validar currency**
```javascript
if (session.currency && session.currency.toUpperCase() !== 'MXN') {
  console.warn('[WEBHOOK] Currency mismatch:', {
    expected: 'MXN',
    actual: session.currency
  })
  // Loggear pero continuar
}
```

**3.5. Validar suma de cuotas pendientes**
```javascript
const sumPending = pendingPayments.reduce((sum, p) => sum + (p.amount_due || 0), 0)
const expectedRemaining = layaway.amount_remaining || 0

if (Math.abs(sumPending - expectedRemaining) > tolerance) {
  console.error('[WEBHOOK] Sum of pending payments mismatch:', {
    sum_pending: sumPending,
    layaway_amount_remaining: expectedRemaining,
    difference: Math.abs(sumPending - expectedRemaining)
  })
  // CRÍTICO: Si diferencia > $1, loggear pero continuar
}
```

**3.6. Validar product_id (después de buscar layaway)**
```javascript
// Esto se valida implícitamente porque layaway.product_id ya existe
// Pero lo confirmamos para seguridad
const { data: product, error: productError } = await supabaseAdmin
  .from('products')
  .select('id, status, stock, price')
  .eq('id', layaway.product_id)
  .single()

if (productError || !product) {
  console.error('[WEBHOOK] Product not found:', layaway.product_id)
  return NextResponse.json({ error: 'Product not found' }, { status: 404 })
}

console.log('[WEBHOOK] Product validated:', {
  product_id: product.id,
  current_status: product.status,
  stock: product.stock
})
```

---

### FASE 4: PROCESAMIENTO ATÓMICO

**4.1. Marcar cuotas pendientes como paid**
```javascript
console.log('[WEBHOOK] Marking pending payments as paid...')

const { error: updatePaymentsError } = await supabaseAdmin
  .from('layaway_payments')
  .update({
    status: 'paid',
    amount_paid: supabase.raw('amount_due'),  // amount_paid = amount_due
    paid_at: new Date().toISOString(),
    stripe_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent as string || null,
    updated_at: new Date().toISOString()
  })
  .eq('layaway_id', metadata.layaway_id)
  .in('status', ['pending', 'overdue'])

if (updatePaymentsError) {
  console.error('[WEBHOOK] CRITICAL ERROR updating payments:', updatePaymentsError)
  // NO retornar aquí, intentar rollback o continuar
  throw new Error('Failed to update payments: ' + updatePaymentsError.message)
}

console.log('[WEBHOOK] ✓ Payments updated:', pendingPayments.length)
```

**4.2. Recalcular totales del layaway**
```javascript
// Re-fetch todos los payments para recalcular
const { data: allPaymentsAfter } = await supabaseAdmin
  .from('layaway_payments')
  .select('amount_paid, status')
  .eq('layaway_id', metadata.layaway_id)

const paidPayments = allPaymentsAfter.filter(p => p.status === 'paid')
const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0)
const paymentsCompleted = paidPayments.length

const amountRemaining = Math.max((layaway.total_amount || 0) - totalPaid, 0)
const paymentsRemaining = Math.max((layaway.total_payments || 0) - paymentsCompleted, 0)

console.log('[WEBHOOK] Recalculated:', {
  total_paid: totalPaid,
  amount_remaining: amountRemaining,
  payments_completed: paymentsCompleted,
  payments_remaining: paymentsRemaining
})
```

**4.3. Actualizar layaway a completed**
```javascript
console.log('[WEBHOOK] Updating layaway to completed...')

const { error: updateLayawayError } = await supabaseAdmin
  .from('layaways')
  .update({
    amount_paid: totalPaid,
    amount_remaining: 0,
    payments_completed: paymentsCompleted,
    payments_remaining: 0,
    next_payment_due_date: null,
    next_payment_amount: null,
    last_payment_at: new Date().toISOString(),
    consecutive_weeks_without_payment: 0,
    status: 'completed',
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })
  .eq('id', metadata.layaway_id)

if (updateLayawayError) {
  console.error('[WEBHOOK] CRITICAL ERROR updating layaway:', updateLayawayError)
  throw new Error('Failed to update layaway: ' + updateLayawayError.message)
}

console.log('[WEBHOOK] ✓ Layaway marked as completed')
```

**4.4. Generar tracking_token único**
```javascript
async function generateUniqueTrackingToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Sin confusos
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    let token = ''
    for (let i = 0; i < 8; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    // Verificar unicidad
    const { data: existing } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('tracking_token', token)
      .single()
    
    if (!existing) {
      return token
    }
    
    attempts++
  }
  
  // Fallback: agregar timestamp
  const baseToken = Array(8).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
  return baseToken.substring(0, 6) + Date.now().toString().slice(-2)
}

const trackingToken = await generateUniqueTrackingToken()
console.log('[WEBHOOK] Generated tracking token:', trackingToken)
```

**4.5. Crear order final**
```javascript
console.log('[WEBHOOK] Creating final order...')

const { data: order, error: orderError } = await supabaseAdmin
  .from('orders')
  .insert({
    user_id: layaway.user_id || null,
    customer_name: layaway.customer_name,
    customer_email: layaway.customer_email,
    customer_phone: layaway.customer_phone || null,
    total: layaway.total_amount,
    subtotal: layaway.total_amount,
    shipping: 0,
    status: 'confirmed',               // ← Estado de orden
    payment_status: 'paid',            // ← Pago completado
    shipping_status: 'pending',        // ← Envío pendiente
    stripe_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent as string || null,
    layaway_id: layaway.id,
    tracking_token: trackingToken,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })
  .select()
  .single()

if (orderError) {
  console.error('[WEBHOOK] CRITICAL ERROR creating order:', orderError)
  throw new Error('Failed to create order: ' + orderError.message)
}

console.log('[WEBHOOK] ✓ Order created:', order.id)
```

**4.6. Crear order_item**
```javascript
console.log('[WEBHOOK] Creating order_item...')

const { error: itemError } = await supabaseAdmin
  .from('order_items')
  .insert({
    order_id: order.id,
    product_id: layaway.product_id,
    quantity: 1,
    unit_price: layaway.total_amount,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

if (itemError) {
  console.error('[WEBHOOK] ERROR creating order_item:', itemError)
  // NO es crítico si la orden ya se creó, pero loggear
  // Podría intentar crear de nuevo en retry
}

console.log('[WEBHOOK] ✓ Order item created')
```

**4.7. Vincular order_id al layaway**
```javascript
const { error: linkError } = await supabaseAdmin
  .from('layaways')
  .update({ 
    order_id: order.id,
    updated_at: new Date().toISOString()
  })
  .eq('id', metadata.layaway_id)

if (linkError) {
  console.error('[WEBHOOK] ERROR linking order to layaway:', linkError)
  // NO crítico, pero loggear
}

console.log('[WEBHOOK] ✓ Order linked to layaway')
```

**4.8. Marcar product como sold y stock = 0**
```javascript
console.log('[WEBHOOK] Updating product to sold...')

const { error: productUpdateError } = await supabaseAdmin
  .from('products')
  .update({
    status: 'sold',
    stock: 0,
    updated_at: new Date().toISOString()
  })
  .eq('id', layaway.product_id)

if (productUpdateError) {
  console.error('[WEBHOOK] ERROR updating product:', productUpdateError)
  // NO crítico para el flujo, pero loggear
}

console.log('[WEBHOOK] ✓ Product marked as sold')
```

**4.9. Retornar éxito**
```javascript
console.log('[WEBHOOK] SUCCESS: Full balance payment processed completely', {
  layaway_id: layaway.id,
  order_id: order.id,
  tracking_token: trackingToken,
  amount_paid: totalPaid,
  product_id: layaway.product_id
})

return NextResponse.json({ received: true }, { status: 200 })
```

---

## 2. TRANSACCIÓN vs PASOS IDEMPOTENTES

### DECISIÓN: **PASOS IDEMPOTENTES** (No transacción SQL)

**Razón:**
- Supabase/PostgreSQL soporta transacciones, pero el webhook de Stripe se ejecuta en un endpoint Next.js que no garantiza atomicidad entre múltiples llamadas API
- Si el webhook falla a mitad de camino, Stripe **reintentará automáticamente**
- La idempotencia debe estar en **cada paso**, no en una transacción global

**Estrategia:**
1. Cada operación (UPDATE payments, UPDATE layaway, INSERT order) es **idempotente por sí misma**
2. Si el webhook se ejecuta 2 veces:
   - Los checks de idempotencia (Fase 2) detectan que ya se procesó
   - Retorna 200 OK sin duplicar datos
3. Si falla después de marcar payments paid pero antes de crear order:
   - Stripe reintenta
   - Los checks detectan que payments ya están paid
   - Continúa desde donde falló (crear order)

**Orden crítico:**
```
1. Marcar payments → paid
2. Actualizar layaway → completed
3. Crear order
4. Crear order_item
5. Actualizar product → sold
```

**Si falla en paso N:** Stripe reintenta → Los checks idempotentes saltan pasos ya completados → Continúa desde paso N.

---

## 3. CÓMO EVITAR ORDER DUPLICADA

### Estrategia Multi-Capa

**CHECK 1: Verificar layaway.order_id antes de crear**
```javascript
if (layaway.order_id) {
  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('id', layaway.order_id)
    .single()
  
  if (existingOrder) {
    console.log('[WEBHOOK] Order already exists, skip creation')
    return NextResponse.json({ received: true, idempotent: true }, { status: 200 })
  }
}
```

**CHECK 2: Unique constraint en DB (recomendado agregar)**
```sql
-- Migración futura (no implementar ahora)
CREATE UNIQUE INDEX idx_orders_layaway_id 
ON orders(layaway_id) 
WHERE layaway_id IS NOT NULL;
```

Esto evita que se creen 2 orders con el mismo `layaway_id`, incluso en race conditions.

**CHECK 3: Verificar por stripe_session_id**
```javascript
const { data: orderBySession } = await supabaseAdmin
  .from('orders')
  .select('id')
  .eq('stripe_session_id', session.id)
  .single()

if (orderBySession) {
  console.log('[WEBHOOK] Order already exists for this session')
  return NextResponse.json({ received: true, idempotent: true }, { status: 200 })
}
```

**Orden de checks:**
1. `layaway.status === 'completed'` → early return
2. `layaway.order_id exists` → early return
3. `order con stripe_session_id exists` → early return
4. Si ninguno dispara → crear order

---

## 4. CÓMO CREAR TRACKING_TOKEN

### Implementación (ya definida en Fase 4.4)

**Características:**
- 8 caracteres alfanuméricos uppercase
- Sin caracteres confusos (I, O, 0, 1)
- Verificación de unicidad en DB
- Hasta 10 intentos de generar único
- Fallback: agregar timestamp si agota intentos

**Función:**
```javascript
async function generateUniqueTrackingToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    let token = ''
    for (let i = 0; i < 8; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    const { data: existing } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('tracking_token', token)
      .single()
    
    if (!existing) return token
    attempts++
  }
  
  // Fallback
  const base = Array(8).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
  return base.substring(0, 6) + Date.now().toString().slice(-2)
}
```

**Probabilidad de colisión:**
- Caracteres: 32 (26 letras + 6 números sin confusos)
- Longitud: 8
- Espacio: 32^8 = 1,099,511,627,776 (1 billón+)
- Con 10,000 órdenes: probabilidad < 0.000001%

---

## 5. CAMPOS EXACTOS DE ORDERS

### Tabla: orders

```javascript
{
  // IDs
  id: uuid,                          // Auto-generado por Supabase
  user_id: uuid | null,              // layaway.user_id (puede ser null si guest)
  layaway_id: uuid | null,           // layaway.id (vincula al apartado)
  
  // Cliente
  customer_name: string,             // layaway.customer_name
  customer_email: string,            // layaway.customer_email
  customer_phone: string | null,     // layaway.customer_phone
  
  // Montos
  total: number,                     // layaway.total_amount (189000)
  subtotal: number,                  // layaway.total_amount (189000)
  shipping: number,                  // 0 (sin envío por ahora)
  
  // Estados
  status: 'confirmed',               // ← Orden confirmada (pago completado)
  payment_status: 'paid',            // ← Pago completado
  shipping_status: 'pending',        // ← Envío pendiente (admin actualizará)
  
  // Stripe
  stripe_session_id: string,         // session.id
  stripe_payment_intent_id: string | null,  // session.payment_intent
  
  // Tracking
  tracking_token: string,            // Generado (8 chars uppercase)
  
  // Timestamps
  created_at: timestamp,             // NOW()
  updated_at: timestamp              // NOW()
}
```

**Valores específicos para apartado completado:**
```javascript
{
  id: '[auto-generated]',
  user_id: layaway.user_id || null,
  layaway_id: layaway.id,                    // ← CRÍTICO: vincula al apartado
  customer_name: layaway.customer_name,
  customer_email: layaway.customer_email,
  customer_phone: layaway.customer_phone,
  total: layaway.total_amount,               // 189000
  subtotal: layaway.total_amount,            // 189000
  shipping: 0,
  status: 'confirmed',                       // Orden confirmada
  payment_status: 'paid',                    // Pago completado
  shipping_status: 'pending',                // Envío pendiente
  stripe_session_id: session.id,
  stripe_payment_intent_id: session.payment_intent || null,
  tracking_token: '[generated-8chars]',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}
```

---

## 6. CAMPOS EXACTOS DE ORDER_ITEMS

### Tabla: order_items

```javascript
{
  // IDs
  id: uuid,                          // Auto-generado por Supabase
  order_id: uuid,                    // order.id (FK a orders)
  product_id: uuid,                  // layaway.product_id
  
  // Cantidad y precio
  quantity: number,                  // 1 (siempre 1 para productos de lujo)
  unit_price: number,                // layaway.total_amount (189000)
  
  // Timestamps
  created_at: timestamp,             // NOW()
  updated_at: timestamp              // NOW()
}
```

**Valores específicos:**
```javascript
{
  id: '[auto-generated]',
  order_id: order.id,                        // ID de la orden recién creada
  product_id: layaway.product_id,            // ID del producto apartado
  quantity: 1,                               // Siempre 1 (producto único)
  unit_price: layaway.total_amount,          // 189000
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}
```

**Nota:** No se guarda subtotal individual porque `quantity * unit_price = total` siempre.

---

## 7. STATUS FINAL EN ORDERS

### payment_status: `'paid'`
**Razón:** El pago se completó a través de Stripe. Todo el monto fue cobrado (ya sea por cuotas o saldo completo).

**Estados posibles (schema actual):**
- `pending` — Pago pendiente
- `paid` — Pago completado ✅ (este caso)
- `failed` — Pago fallido
- `refunded` — Pago reembolsado

**Para apartado completado:** `'paid'` ✅

---

### status: `'confirmed'`
**Razón:** La orden está confirmada y lista para procesamiento (preparación de envío).

**Estados posibles (schema actual):**
- `pending` — Orden creada, esperando pago
- `confirmed` — Pago confirmado, orden lista ✅ (este caso)
- `processing` — Orden en preparación
- `shipped` — Orden enviada
- `delivered` — Orden entregada
- `cancelled` — Orden cancelada

**Para apartado completado:** `'confirmed'` ✅

**Siguiente paso:** Admin cambiará a `processing` → `shipped` → `delivered`

---

### shipping_status: `'pending'`
**Razón:** El envío aún no ha sido procesado. Admin debe preparar y enviar el producto.

**Estados posibles (schema actual):**
- `pending` — Envío pendiente ✅ (este caso)
- `processing` — Preparando envío
- `shipped` — Enviado
- `delivered` — Entregado
- `failed` — Fallo en envío

**Para apartado completado:** `'pending'` ✅

**Siguiente paso:** Admin actualizará a `processing` cuando prepare el paquete

---

## 8. QUÉ PASA SI FALLA DESPUÉS DE MARCAR CUOTAS PAID PERO ANTES DE CREAR ORDER

### Escenario del problema

```
Estado inicial:
- Payments #5-8: pending
- Layaway: active, amount_remaining = 84000
- Order: no existe

Webhook ejecuta:
1. ✅ Marca payments #5-8 como paid
2. ✅ Actualiza layaway a completed
3. ❌ FALLA al crear order (error DB, timeout, etc.)

Estado final inconsistente:
- Payments #5-8: paid ✅
- Layaway: completed ✅
- Order: NO EXISTE ❌ ← PROBLEMA
- Product: available (debería ser sold) ❌
```

### Solución: RETRY con Idempotencia

**Cuando Stripe reintenta el webhook:**

```javascript
// CHECK IDEMPOTENCIA #1
if (layaway.status === 'completed') {
  console.log('[WEBHOOK] Layaway already completed')
  
  // CHECK: ¿Tiene order?
  if (layaway.order_id) {
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('id', layaway.order_id)
      .single()
    
    if (existingOrder) {
      console.log('[WEBHOOK] Order already exists (IDEMPOTENT)')
      return NextResponse.json({ received: true }, { status: 200 })
    }
  }
  
  // Si layaway completed pero SIN order, continuar para crear order
  console.warn('[WEBHOOK] Layaway completed but missing order, creating...')
}

// CHECK IDEMPOTENCIA #3
const { data: pendingPayments } = await supabaseAdmin
  .from('layaway_payments')
  .select('*')
  .eq('layaway_id', layaway_id)
  .in('status', ['pending', 'overdue'])

if (pendingPayments.length === 0) {
  console.log('[WEBHOOK] All payments already paid')
  
  // No hay cuotas pendientes, pero verificar si hay order
  if (!layaway.order_id) {
    console.warn('[WEBHOOK] Payments paid but order missing, creating...')
    // Continuar a crear order
  } else {
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
```

**Flujo de recuperación:**

```
Stripe reintenta (automático):
1. CHECK: layaway.status === 'completed' → SÍ
2. CHECK: layaway.order_id exists → NO
3. LOG: "Layaway completed but missing order, creating..."
4. SALTAR: Marcar payments (ya están paid)
5. SALTAR: Actualizar layaway (ya está completed)
6. EJECUTAR: Crear order ← Continúa desde donde falló
7. EJECUTAR: Crear order_item
8. EJECUTAR: Actualizar product → sold
9. SUCCESS
```

**Resultado:** La orden se crea en el retry, sin duplicar payments ni layaway.

---

## 9. CÓMO REINTENTAR DE FORMA SEGURA

### Estrategia Stripe Retry Automático

**Stripe reintenta automáticamente webhooks fallidos:**
- 1er intento: inmediato
- 2do intento: ~5 segundos después
- 3er intento: ~30 segundos después
- 4to-10mo intento: incremento exponencial (hasta 3 días)

**Nuestra estrategia:**

**1. Idempotencia en CADA paso**
```javascript
// Paso 1: Marcar payments
if (pendingPayments.length > 0) {
  await updatePayments()
} else {
  console.log('Payments already paid, skipping')
}

// Paso 2: Actualizar layaway
if (layaway.status !== 'completed') {
  await updateLayaway()
} else {
  console.log('Layaway already completed, skipping')
}

// Paso 3: Crear order
if (!layaway.order_id) {
  await createOrder()
} else {
  console.log('Order already exists, skipping')
}
```

**2. Logging detallado**
```javascript
console.log('[WEBHOOK] Processing layaway_full_balance', {
  layaway_id,
  session_id: session.id,
  attempt: session.metadata?.retry_count || 1,
  current_status: layaway.status,
  has_order: !!layaway.order_id
})
```

**3. NO lanzar excepciones en pasos no críticos**
```javascript
// CRÍTICO: Marcar payments
const { error: updatePaymentsError } = await updatePayments()
if (updatePaymentsError) {
  throw new Error('CRITICAL: Failed to update payments')  // ← Retry
}

// NO CRÍTICO: Actualizar product
const { error: productError } = await updateProduct()
if (productError) {
  console.error('ERROR updating product:', productError)  // ← Log pero continuar
  // NO throw, porque order ya se creó
}
```

**4. Retornar siempre 200 si el trabajo ya está hecho**
```javascript
// Si todos los checks de idempotencia pasan
return NextResponse.json({ 
  received: true, 
  idempotent: true,
  message: 'Already processed'
}, { status: 200 })
```

Esto le dice a Stripe: "Recibí el evento, todo bien, no reintentes más".

---

## 10. QUERIES DE VALIDACIÓN POST-PAGO

### Query 1: Verificar layaway completado
```sql
-- Conceptual (no ejecutar)
SELECT 
  id,
  status,
  amount_paid,
  amount_remaining,
  payments_completed,
  payments_remaining,
  order_id,
  completed_at
FROM layaways
WHERE id = '[layaway_id]';

-- Esperado:
-- status: 'completed'
-- amount_paid: 189000
-- amount_remaining: 0
-- payments_completed: 8
-- payments_remaining: 0
-- order_id: '[uuid]' (no null)
-- completed_at: '[timestamp]'
```

### Query 2: Verificar todos los payments paid
```sql
-- Conceptual (no ejecutar)
SELECT 
  payment_number,
  amount_due,
  amount_paid,
  status,
  stripe_session_id,
  paid_at
FROM layaway_payments
WHERE layaway_id = '[layaway_id]'
ORDER BY payment_number ASC;

-- Esperado:
-- Todos con status = 'paid'
-- amount_paid = amount_due (cada uno)
-- Cuotas 1-4: diferentes stripe_session_id (pagos individuales)
-- Cuotas 5-8: mismo stripe_session_id (pago de saldo completo)
-- Todos tienen paid_at
```

### Query 3: Verificar order creada
```sql
-- Conceptual (no ejecutar)
SELECT 
  id,
  customer_email,
  total,
  status,
  payment_status,
  shipping_status,
  stripe_session_id,
  layaway_id,
  tracking_token,
  created_at
FROM orders
WHERE layaway_id = '[layaway_id]';

-- Esperado:
-- Exactamente 1 orden
-- total: 189000
-- status: 'confirmed'
-- payment_status: 'paid'
-- shipping_status: 'pending'
-- layaway_id: '[layaway_id]' (vinculada)
-- tracking_token: '[8chars]' (único)
```

### Query 4: Verificar order_item creado
```sql
-- Conceptual (no ejecutar)
SELECT 
  oi.id,
  oi.order_id,
  oi.product_id,
  oi.quantity,
  oi.unit_price,
  p.title,
  p.brand
FROM order_items oi
JOIN products p ON p.id = oi.product_id
WHERE oi.order_id = '[order_id]';

-- Esperado:
-- Exactamente 1 item
-- quantity: 1
-- unit_price: 189000
-- product_id: '[product_id del layaway]'
```

### Query 5: Verificar product sold
```sql
-- Conceptual (no ejecutar)
SELECT 
  id,
  title,
  brand,
  status,
  stock,
  price
FROM products
WHERE id = '[product_id]';

-- Esperado:
-- status: 'sold'
-- stock: 0
-- price: 189000 (sin cambios)
```

### Query 6: Verificar suma total
```sql
-- Conceptual (no ejecutar)
SELECT 
  SUM(amount_paid) as total_paid_via_payments
FROM layaway_payments
WHERE layaway_id = '[layaway_id]';

-- Comparar con:
SELECT 
  amount_paid as total_paid_via_layaway
FROM layaways
WHERE id = '[layaway_id]';

-- Esperado:
-- Ambos deben ser 189000
```

---

## 11. REGLAS DE IDEMPOTENCIA CONSOLIDADAS

### Regla 1: Checks al inicio
```javascript
// CHECK: Layaway ya completed + tiene order
if (layaway.status === 'completed' && layaway.order_id) {
  const order = await fetchOrder(layaway.order_id)
  if (order && order.payment_status === 'paid') {
    return 200 OK (idempotent)
  }
}
```

### Regla 2: Checks antes de cada operación
```javascript
// Marcar payments
if (pendingPayments.length === 0) {
  skip // Ya están paid
}

// Actualizar layaway
if (layaway.status === 'completed' && layaway.amount_remaining === 0) {
  skip // Ya está completed
}

// Crear order
if (layaway.order_id || orderBySessionExists) {
  skip // Ya existe order
}
```

### Regla 3: Operaciones UPDATE son inherentemente idempotentes
```sql
-- Si se ejecuta 2 veces, el resultado es el mismo
UPDATE layaway_payments
SET status = 'paid', amount_paid = amount_due
WHERE layaway_id = '...' AND status IN ('pending', 'overdue');

-- Si no hay pending/overdue, no actualiza nada (0 filas)
```

### Regla 4: Operaciones INSERT requieren check previo
```javascript
// ANTES de INSERT order
const existing = await findOrderByLayawayId(layaway_id)
if (existing) {
  return existing // No insertar de nuevo
}

await insertOrder(...)
```

### Regla 5: Siempre retornar 200 si trabajo ya hecho
```javascript
if (alreadyProcessed) {
  return NextResponse.json({ 
    received: true, 
    idempotent: true 
  }, { status: 200 })
}
```

---

## 12. RIESGOS IDENTIFICADOS

### RIESGO 1: Race condition en creación de order
**Descripción:** Webhook se ejecuta 2 veces en paralelo antes de que el primero termine.

**Mitigación:**
- Unique constraint en `orders.layaway_id` (migración futura)
- Checks idempotentes antes de INSERT
- Si falla por duplicado, catch error y retornar 200

**Severidad:** Media  
**Probabilidad:** Muy baja  
**Impacto:** Medio (orden duplicada, pero detectable)

---

### RIESGO 2: Falla entre completar layaway y crear order
**Descripción:** Layaway queda completed pero sin order vinculada.

**Mitigación:**
- Stripe retry automático
- Checks detectan layaway completed sin order
- Continúa creando order en retry

**Severidad:** Media  
**Probabilidad:** Baja  
**Impacto:** Temporal (se resuelve en retry)

---

### RIESGO 3: Product no actualiza a sold
**Descripción:** Order se crea pero product queda en otro estado.

**Mitigación:**
- Logging del error
- NO bloquear flujo (order ya se creó)
- Admin puede corregir manualmente
- Cron job futuro para detectar inconsistencias

**Severidad:** Baja  
**Probabilidad:** Muy baja  
**Impacto:** Bajo (no afecta al cliente, solo a inventario)

---

### RIESGO 4: Monto cobrado no coincide con amount_remaining
**Descripción:** Stripe cobra $80,000 pero layaway.amount_remaining era $84,000.

**Mitigación:**
- Validación de monto al inicio del webhook
- Loggear discrepancia
- **Procesar de todas formas** (Stripe ya cobró, cliente ya pagó)
- Investigar causa después

**Severidad:** Media  
**Probabilidad:** Muy baja  
**Impacto:** Medio (posible pérdida de $4,000, pero detectable)

---

### RIESGO 5: Tracking token duplicado
**Descripción:** Genera tracking_token que ya existe.

**Mitigación:**
- Verificación de unicidad con retry (10 intentos)
- Fallback con timestamp
- Probabilidad < 0.000001% con 10,000 órdenes

**Severidad:** Baja  
**Probabilidad:** Muy baja  
**Impacto:** Bajo (tracking confuso pero orden existe)

---

### RIESGO 6: Suma de cuotas pendientes ≠ amount_remaining
**Descripción:** Por bug previo, suma no coincide.

**Mitigación:**
- Validación al inicio
- Loggear diferencia
- Continuar de todas formas (marcar cuotas existentes como paid)
- Investigar inconsistencia después

**Severidad:** Media  
**Probabilidad:** Muy baja  
**Impacto:** Medio (inconsistencia contable)

---

## 13. PLAN DE ROLLBACK/RECUPERACIÓN

### Escenario 1: Orden duplicada accidentalmente
**Detección:** 2 orders con mismo `layaway_id`

**Recuperación manual:**
```sql
-- 1. Identificar orden correcta (la primera creada)
SELECT id, created_at, tracking_token
FROM orders
WHERE layaway_id = '[layaway_id]'
ORDER BY created_at ASC;

-- 2. Eliminar orden duplicada (la segunda)
DELETE FROM order_items WHERE order_id = '[orden_duplicada_id]';
DELETE FROM orders WHERE id = '[orden_duplicada_id]';

-- 3. Verificar que layaway apunta a orden correcta
UPDATE layaways
SET order_id = '[orden_correcta_id]'
WHERE id = '[layaway_id]';
```

---

### Escenario 2: Layaway completed pero sin order
**Detección:** `layaway.status = 'completed'` pero `order_id IS NULL`

**Recuperación automática:** Stripe retry (ver sección 8)

**Recuperación manual:**
```sql
-- 1. Verificar que todas las cuotas están paid
SELECT payment_number, status, amount_paid
FROM layaway_payments
WHERE layaway_id = '[layaway_id]';

-- 2. Verificar que no hay order en otra tabla
SELECT * FROM orders WHERE layaway_id = '[layaway_id]';

-- 3. Si no existe order, crear manualmente:
-- (Ejecutar función createOrderFromLayaway desde admin)
```

---

### Escenario 3: Product no marcado como sold
**Detección:** Order existe, layaway completed, pero `product.status != 'sold'`

**Recuperación manual:**
```sql
-- 1. Verificar que order existe y está paid
SELECT id, payment_status FROM orders WHERE layaway_id = '[layaway_id]';

-- 2. Actualizar product manualmente
UPDATE products
SET status = 'sold', stock = 0
WHERE id = '[product_id]';
```

---

### Escenario 4: Cuotas no marcadas como paid
**Detección:** Stripe cobró, pero algunas cuotas siguen `pending`

**Recuperación:** Stripe retry (automático)

**Recuperación manual:**
```sql
-- 1. Verificar pago en Stripe Dashboard
-- 2. Si pago confirmado, marcar cuotas manualmente:
UPDATE layaway_payments
SET 
  status = 'paid',
  amount_paid = amount_due,
  paid_at = NOW(),
  stripe_session_id = '[session_id]',
  stripe_payment_intent_id = '[payment_intent_id]'
WHERE layaway_id = '[layaway_id]'
  AND status IN ('pending', 'overdue');
```

---

## 14. CRITERIOS DE CIERRE

**Fase 5C.3B.4B se considera CERRADA cuando:**

### Tests de funcionalidad ✅
1. [ ] Webhook recibe evento `checkout.session.completed` con `metadata.type = layaway_full_balance`
2. [ ] Valida metadata completa (layaway_id, user_id, balance_amount, etc.)
3. [ ] Marca cuotas pending/overdue como `paid`
4. [ ] Actualiza layaway a `completed`
5. [ ] Crea order final con todos los campos correctos
6. [ ] Crea order_item vinculado
7. [ ] Marca product como `sold` y stock = 0
8. [ ] Genera tracking_token único
9. [ ] Order aparece en "Mis pedidos"
10. [ ] Apartado aparece como "completado" en "Mis apartados"

### Tests de idempotencia ✅
11. [ ] Stripe reenvía evento → No duplica cuotas
12. [ ] Stripe reenvía evento → No duplica order
13. [ ] Stripe reenvía evento → Retorna 200 OK
14. [ ] Layaway ya completed + order exists → Early return 200

### Tests de validación ✅
15. [ ] Rechaza evento sin metadata completa
16. [ ] Rechaza si `payment_status != 'paid'`
17. [ ] Rechaza si ownership no coincide
18. [ ] Loggea advertencia si monto no coincide (pero procesa)
19. [ ] Loggea advertencia si suma cuotas no coincide (pero procesa)

### Tests de recuperación ✅
20. [ ] Webhook falla después de marcar payments → Retry crea order
21. [ ] Webhook falla después de crear order → Retry no duplica
22. [ ] Product no se actualiza → Order existe de todas formas

### Validaciones DB ✅
23. [ ] `layaway.status = 'completed'`
24. [ ] `layaway.amount_paid = total_amount`
25. [ ] `layaway.amount_remaining = 0`
26. [ ] `layaway.payments_completed = total_payments`
27. [ ] `layaway.order_id` vinculado correctamente
28. [ ] Todas las cuotas tienen `status = 'paid'`
29. [ ] Cuotas liquidadas tienen mismo `stripe_session_id`
30. [ ] Order tiene `payment_status = 'paid'`, `status = 'confirmed'`
31. [ ] Order_item existe con `quantity = 1`, `unit_price = total_amount`
32. [ ] Product tiene `status = 'sold'`, `stock = 0`
33. [ ] Tracking token es único (8 chars)

### Areas no tocadas ✅
34. [ ] UI no modificada
35. [ ] Admin no modificado
36. [ ] DB schema no modificado
37. [ ] RLS no modificado
38. [ ] Productos no relacionados no tocados
39. [ ] Orders no relacionadas no tocadas

**Total:** 39 criterios de cierre

---

## 15. CONFIRMACIÓN FINAL

### ❌ NO SE IMPLEMENTÓ NADA

- ❌ NO se tocó código
- ❌ NO se tocó `src/app/api/stripe/webhook/route.ts`
- ❌ NO se ejecutó SQL
- ❌ NO se aplicaron migraciones
- ❌ NO se modificó DB
- ❌ NO se tocó UI
- ❌ NO se tocó admin
- ❌ NO se tocó Stripe
- ❌ NO se hizo deploy

**Este documento es SOLO propuesta técnica.**

---

## 16. RESUMEN EJECUTIVO

### Objetivo
Procesar el pago de saldo completo de un apartado de forma **atómica, segura e idempotente**.

### Estrategia
- **Idempotencia multi-capa** en lugar de transacción SQL
- **Checks antes de cada operación** para evitar duplicados
- **Stripe retry automático** para recuperación de fallos
- **Logging detallado** para debugging y auditoría

### Flujo
```
1. Validar evento Stripe
2. Checks de idempotencia (3 niveles)
3. Validaciones de seguridad (6 checks)
4. Marcar cuotas → paid
5. Actualizar layaway → completed
6. Crear order final
7. Crear order_item
8. Actualizar product → sold
9. Retornar 200 OK
```

### Orden crítico
```
Payments → Layaway → Order → Order_item → Product
```

Si falla en cualquier punto, Stripe reintenta y los checks idempotentes saltan pasos completados.

### Campos clave
- **orders.status:** `'confirmed'`
- **orders.payment_status:** `'paid'`
- **orders.shipping_status:** `'pending'`
- **orders.layaway_id:** vinculado al apartado

### Riesgos principales
1. Race condition → Mitigado con checks + unique constraint futuro
2. Fallo parcial → Mitigado con idempotencia + Stripe retry
3. Product no sold → No crítico, admin corrige

### Próximo paso
Esperar aprobación de Jhonatan para implementar.

---

**Propuesta preparada por:** Kepler  
**Fecha:** 2026-05-03  
**Status:** 📋 PENDIENTE APROBACIÓN  
**Implementación:** ⏸️ BLOQUEADA hasta aprobación
