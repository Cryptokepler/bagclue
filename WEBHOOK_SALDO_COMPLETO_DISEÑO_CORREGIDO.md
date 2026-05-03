# WEBHOOK SALDO COMPLETO — DISEÑO CORREGIDO
**Fecha:** 2026-05-03  
**Proyecto:** Bagclue E-commerce de Lujo  
**Autor:** Kepler  
**Status:** ⏸️ DISEÑO CORREGIDO - NO IMPLEMENTADO

---

## ⚠️ CONFIRMACIÓN ABSOLUTA

### ❌ NO SE IMPLEMENTÓ NADA

- ❌ NO se tocó webhook
- ❌ NO se tocó código
- ❌ NO se tocó base de datos
- ❌ NO se deployó nada

**Este documento es corrección del diseño técnico.**

---

## CORRECCIONES APLICADAS

### 1. ✅ order_items COMPLETO

**ANTES (Incompleto):**
```javascript
{
  order_id: order.id,
  product_id: layaway.product_id,
  quantity: 1,
  unit_price: layaway.total_amount
}
```

**AHORA (Completo - Patrón de Checkout):**
```javascript
{
  order_id: order.id,
  product_id: layaway.product_id,
  quantity: 1,
  unit_price: layaway.total_amount,
  subtotal: layaway.total_amount,  // ✅ Agregado
  product_snapshot: {               // ✅ Agregado
    title: product.title,
    brand: product.brand,
    model: product.model || null,
    color: product.color || null,
    slug: product.slug,
    price: product.price || layaway.total_amount,
    currency: product.currency || 'MXN'
  }
}
```

**Razón:** Sin `product_snapshot`, "Mis pedidos", admin y tracking NO pueden mostrar información del producto.

---

### 2. ✅ NO usar supabaseAdmin.raw()

**ANTES (Sintaxis incorrecta):**
```javascript
.update({
  status: 'paid',
  amount_paid: supabaseAdmin.raw('amount_due'),  // ❌ No existe
  ...
})
```

**AHORA (Estrategia segura):**
```javascript
// 1. Primero leer pending payments
const { data: pendingPayments } = await supabaseAdmin
  .from('layaway_payments')
  .select('*')
  .eq('layaway_id', layaway_id)
  .in('status', ['pending', 'overdue'])

// 2. Actualizar cada payment individualmente
for (const payment of pendingPayments) {
  await supabaseAdmin
    .from('layaway_payments')
    .update({
      status: 'paid',
      amount_paid: payment.amount_due,  // ✅ Usar valor del fetch
      paid_at: new Date().toISOString(),
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', payment.id)
}
```

**Razón:** `supabaseAdmin.raw()` no es sintaxis válida en Supabase JS client.

---

### 3. ✅ Ejemplos con datos reales del test

**ANTES (Datos ficticios):**
```javascript
{
  "total_amount": 450000,
  "amount_paid": 450000,
  ...
}
```

**AHORA (Datos reales del test):**
```javascript
{
  "total_amount": 189000,
  "amount_paid": 105000,  // Antes de pagar saldo
  "amount_remaining": 84000,
  
  // Después de pagar saldo completo:
  "amount_paid": 189000,
  "amount_remaining": 0,
  "payments_completed": 8,
  "payments_remaining": 0
}
```

**Test layaway_id:** `aaaaaaaa-bbbb-cccc-dddd-000000000001`

---

### 4. ✅ Producto - No asumir estado previo

**ANTES (Asumía reserved):**
```javascript
// Update product: reserved → sold
await supabaseAdmin
  .from('products')
  .update({ status: 'sold', stock: 0 })
  .eq('id', layaway.product_id)
```

**AHORA (Seguro - cualquier estado):**
```javascript
// Fetch product primero para log
const { data: productBefore } = await supabaseAdmin
  .from('products')
  .select('id, status, stock')
  .eq('id', layaway.product_id)
  .single()

console.log('[WEBHOOK FULL_BALANCE] Product BEFORE update:', {
  product_id: layaway.product_id,
  current_status: productBefore?.status,
  current_stock: productBefore?.stock
})

// Update a sold/0 sin asumir estado previo
const { error: productError } = await supabaseAdmin
  .from('products')
  .update({ status: 'sold', stock: 0 })
  .eq('id', layaway.product_id)

console.log('[WEBHOOK FULL_BALANCE] Product AFTER update:', {
  product_id: layaway.product_id,
  new_status: 'sold',
  new_stock: 0,
  success: !productError
})
```

**Razón:** En test, producto puede estar `available` porque no tocamos producto para evitar riesgo.

---

### 5. ✅ tracking_token - Verificar unicidad

**ANTES (Solo generar random):**
```javascript
const tracking_token = generateTrackingToken()

await supabaseAdmin.from('orders').insert({
  ...,
  tracking_token: tracking_token
})
```

**AHORA (Loop con verificación):**
```javascript
async function generateUniqueTrackingToken() {
  const maxAttempts = 5
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Generar token random
    const token = crypto.randomBytes(16).toString('hex')
    
    // Verificar si existe
    const { data: existing } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('tracking_token', token)
      .single()
    
    if (!existing) {
      console.log(`[WEBHOOK FULL_BALANCE] Tracking token generated (attempt ${attempt})`)
      return token
    }
    
    console.warn(`[WEBHOOK FULL_BALANCE] Tracking token collision (attempt ${attempt}/${maxAttempts})`)
  }
  
  throw new Error('Failed to generate unique tracking_token after 5 attempts')
}

// Uso:
const tracking_token = await generateUniqueTrackingToken()
```

**Razón:** Aunque improbable, verificar unicidad es fácil y evita riesgo.

---

### 6. ✅ order - Campos exactos del patrón checkout

**ANTES (Incompleto):**
```javascript
{
  customer_name,
  customer_email,
  customer_phone,
  user_id,
  total,
  subtotal,
  shipping,
  status,
  payment_status,
  stripe_session_id,
  stripe_payment_intent_id,
  layaway_id,
  tracking_token
}
```

**AHORA (Completo - Patrón Checkout):**
```javascript
{
  customer_name: layaway.customer_name,
  customer_email: layaway.customer_email,
  customer_phone: layaway.customer_phone || null,
  shipping_address: null,  // ✅ Agregado - apartado no tiene dirección todavía
  user_id: metadata.user_id || null,  // ✅ Puede ser null si guest
  subtotal: layaway.total_amount,
  shipping: 0,
  total: layaway.total_amount,
  status: 'confirmed',
  payment_status: 'paid',
  stripe_session_id: session.id,
  stripe_payment_intent_id: session.payment_intent as string || null,
  layaway_id: layaway.id,  // ✅ CLAVE: vincular con apartado
  tracking_token: await generateUniqueTrackingToken(),
  created_at: new Date().toISOString()  // ✅ Explícito
}
```

**Campos opcionales actuales que NO necesitamos:**
- `tracking_number` - Admin lo asigna después
- `tracking_url` - Admin lo asigna después
- `shipping_provider` - Admin lo asigna después
- `shipped_at` - Admin lo asigna después
- `delivered_at` - Admin lo asigna después
- `notes` - Admin puede agregar después

---

### 7. ✅ Idempotencia - Índice único + validación

**Estrategia en capas:**

#### Capa 1: Índice único DB (FASE 5C.3B.4B-DB)
```sql
CREATE UNIQUE INDEX idx_orders_layaway_id_unique 
ON orders(layaway_id) 
WHERE layaway_id IS NOT NULL;
```

#### Capa 2: Validación pre-insert en webhook
```javascript
// FASE 2: IDEMPOTENCIA (EARLY RETURN)
const { data: existingOrder } = await supabaseAdmin
  .from('orders')
  .select('id, status, payment_status, created_at')
  .eq('layaway_id', layaway_id)
  .single()

if (existingOrder) {
  console.log('[WEBHOOK FULL_BALANCE] ✓ IDEMPOTENT - Order already exists:', {
    order_id: existingOrder.id,
    layaway_id: layaway_id,
    created_at: existingOrder.created_at,
    status: existingOrder.status
  })
  return NextResponse.json({ received: true, idempotent: true }, { status: 200 })
}
```

#### Capa 3: Try-catch en insert (defensa)
```javascript
try {
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({ ... })
    .select()
    .single()
  
  if (orderError) {
    // Si es error de unique constraint → IDEMPOTENT
    if (orderError.code === '23505') {  // PostgreSQL unique violation
      console.log('[WEBHOOK FULL_BALANCE] ✓ IDEMPOTENT - Caught unique constraint violation')
      return NextResponse.json({ received: true, idempotent: true }, { status: 200 })
    }
    throw orderError
  }
} catch (error) {
  console.error('[WEBHOOK FULL_BALANCE] ERROR creating order:', error)
  return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
}
```

**Razón:** Defensa en profundidad - DB + código.

---

## ORDEN EXACTO DE OPERACIONES (CORREGIDO)

```
TRIGGER: checkout.session.completed con metadata.type='layaway_full_balance'

═══════════════════════════════════════════════════════════════════
FASE 1: VALIDACIONES (FAIL-FAST)
═══════════════════════════════════════════════════════════════════
1.1 Verificar metadata.layaway_id existe
1.2 Verificar session.payment_status === 'paid'
1.3 Verificar session.amount_total existe

1.4 Buscar layaway por id → FAIL si no existe
1.5 Verificar layaway.status IN ('active', 'overdue') → FAIL si no
1.6 Verificar layaway.amount_remaining > 0 → FAIL si completo

1.7 Buscar todos layaway_payments del apartado
1.8 Calcular suma de payments WHERE status IN ('pending', 'overdue')
1.9 Validar suma_pendientes vs amount_remaining (tolerancia $1)

1.10 Validar session.amount_total (centavos) vs amount_remaining*100
     (tolerancia 100 centavos = $1 MXN por redondeos)

═══════════════════════════════════════════════════════════════════
FASE 2: IDEMPOTENCIA (EARLY RETURN)
═══════════════════════════════════════════════════════════════════
2.1 Buscar order existente WHERE layaway_id = $layaway_id
2.2 SI existe → LOG + return 200 (ya procesado)
2.3 SI NO existe → continuar

═══════════════════════════════════════════════════════════════════
FASE 3: BUSCAR PRODUCTO (para product_snapshot)
═══════════════════════════════════════════════════════════════════
3.1 Fetch product completo
    SELECT id, title, brand, model, color, slug, price, currency, status, stock
    FROM products
    WHERE id = $layaway.product_id

3.2 Verificar que producto existe
3.3 Guardar product para snapshots

═══════════════════════════════════════════════════════════════════
FASE 4: MARCAR PAGOS PENDIENTES COMO PAID (ATÓMICO)
═══════════════════════════════════════════════════════════════════
4.1 Leer pending payments (ya lo hicimos en validación)

4.2 Para cada payment en pendingPayments:
    UPDATE layaway_payments
    SET status = 'paid',
        amount_paid = $payment.amount_due,
        paid_at = NOW(),
        stripe_session_id = $session.id,
        stripe_payment_intent_id = $session.payment_intent,
        updated_at = NOW()
    WHERE id = $payment.id

4.3 Verificar que todos los updates fueron exitosos

═══════════════════════════════════════════════════════════════════
FASE 5: RECALCULAR LAYAWAY (DESDE DB)
═══════════════════════════════════════════════════════════════════
5.1 Refresh: Buscar todos los payments del layaway
5.2 Calcular:
    - amount_paid_total = SUM(amount_paid WHERE status='paid')
    - payments_completed_count = COUNT(*) WHERE status='paid'
    - amount_remaining = total_amount - amount_paid_total
    - payments_remaining = total_payments - payments_completed_count

5.3 Verificar que amount_remaining <= $1 (tolerancia redondeo)
    → Si > $1 → FAIL "Incomplete payment"

═══════════════════════════════════════════════════════════════════
FASE 6: GENERAR TRACKING_TOKEN ÚNICO
═══════════════════════════════════════════════════════════════════
6.1 Generar tracking_token random (32 hex chars)
6.2 Verificar que NO existe en orders
6.3 Si existe, regenerar (máximo 5 intentos)
6.4 Si falla 5 veces → ERROR

═══════════════════════════════════════════════════════════════════
FASE 7: CREAR ORDER (ORDEN FINAL)
═══════════════════════════════════════════════════════════════════
7.1 INSERT INTO orders con todos los campos (ver sección 6 arriba)
7.2 Try-catch para unique constraint violation (idempotencia capa 3)
7.3 Verificar insert exitoso
7.4 Guardar order.id

═══════════════════════════════════════════════════════════════════
FASE 8: CREAR ORDER_ITEMS (CON product_snapshot)
═══════════════════════════════════════════════════════════════════
8.1 INSERT INTO order_items con:
    - order_id
    - product_id
    - quantity: 1
    - unit_price: layaway.total_amount
    - subtotal: layaway.total_amount
    - product_snapshot: { ... } (ver sección 1 arriba)

8.2 Verificar insert exitoso

═══════════════════════════════════════════════════════════════════
FASE 9: COMPLETAR LAYAWAY
═══════════════════════════════════════════════════════════════════
9.1 UPDATE layaways
    SET status = 'completed',
        amount_paid = $amount_paid_total,
        amount_remaining = 0,
        payments_completed = $payments_completed_count,
        payments_remaining = 0,
        completed_at = NOW(),
        last_payment_at = NOW(),
        order_id = $order.id,
        next_payment_due_date = NULL,
        next_payment_amount = NULL,
        consecutive_weeks_without_payment = 0
    WHERE id = $layaway_id

9.2 Verificar update exitoso

═══════════════════════════════════════════════════════════════════
FASE 10: MARCAR PRODUCTO SOLD + STOCK 0
═══════════════════════════════════════════════════════════════════
10.1 Fetch product BEFORE (para log)
10.2 UPDATE products
     SET status = 'sold',
         stock = 0
     WHERE id = $layaway.product_id
10.3 Log BEFORE/AFTER
10.4 Verificar update exitoso (NO FAIL si error - solo log)

═══════════════════════════════════════════════════════════════════
FASE 11: LOG SUCCESS
═══════════════════════════════════════════════════════════════════
11.1 LOG webhook success con resumen completo
11.2 RETURN 200
```

---

## ESTADO FINAL ESPERADO (TEST REAL)

### Layaway Test
```json
{
  "id": "aaaaaaaa-bbbb-cccc-dddd-000000000001",
  "status": "completed",
  "total_amount": 189000,
  "amount_paid": 189000,
  "amount_remaining": 0,
  "payments_completed": 8,
  "payments_remaining": 0,
  "completed_at": "2026-05-03T10:00:00Z",
  "order_id": "[UUID del order creado]",
  "next_payment_due_date": null,
  "next_payment_amount": null,
  "consecutive_weeks_without_payment": 0
}
```

### Order Creado
```json
{
  "id": "[UUID generado]",
  "customer_name": "Jhonatan Venegas",
  "customer_email": "jhonatanvenegas@usdtcapital.es",
  "user_id": "9b37d6cc-0b45-4a39-8226-d3022606fcd8",
  "total": 189000,
  "subtotal": 189000,
  "shipping": 0,
  "status": "confirmed",
  "payment_status": "paid",
  "layaway_id": "aaaaaaaa-bbbb-cccc-dddd-000000000001",
  "tracking_token": "[32 hex chars único]",
  "stripe_session_id": "[session.id de Stripe]",
  "stripe_payment_intent_id": "[payment_intent de Stripe]"
}
```

### Order Item
```json
{
  "order_id": "[UUID del order]",
  "product_id": "[UUID del producto]",
  "quantity": 1,
  "unit_price": 189000,
  "subtotal": 189000,
  "product_snapshot": {
    "title": "[Título del producto]",
    "brand": "[Marca]",
    "model": "[Modelo si existe]",
    "color": "[Color si existe]",
    "slug": "[Slug]",
    "price": 189000,
    "currency": "MXN"
  }
}
```

### Layaway Payments (8 cuotas)
```json
// Payments 1-4 (ya estaban paid)
{
  "status": "paid",
  "amount_paid": [amount original],
  "paid_at": "[fechas previas]"
}

// Payments 5-8 (marcados como paid por webhook)
{
  "status": "paid",
  "amount_paid": 21000,
  "paid_at": "2026-05-03T10:00:00Z",
  "stripe_session_id": "[session.id]",
  "stripe_payment_intent_id": "[payment_intent]"
}
```

### Product
```json
{
  "id": "[UUID del producto]",
  "status": "sold",
  "stock": 0
}
```

---

## PRÓXIMOS PASOS

1. ⏳ Jhonatan revisa este diseño corregido
2. ⏳ Jhonatan confirma que correcciones son correctas
3. ⏳ Jhonatan aprueba primero FASE 5C.3B.4B-DB (índice único)
4. ⏳ Kepler aplica migración DB → verifica
5. ⏳ Jhonatan aprueba implementar webhook (FASE 5C.3B.4B)
6. ⏳ Kepler implementa + tests + deploy

---

**Documento generado:** 2026-05-03 09:55 UTC  
**Autor:** Kepler  
**Status:** ✅ DISEÑO CORREGIDO - LISTO PARA REVISIÓN

**Esperando aprobación explícita de Jhonatan.**
