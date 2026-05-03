# FASE 5C.3B.4 — SCOPE: PAGAR SALDO COMPLETO

**Fecha:** 2026-05-03  
**Última actualización:** 2026-05-03 09:10 UTC (corregido según feedback Jhonatan)  
**Autor:** Kepler  
**Status:** 📋 **PROPUESTA CORREGIDA - NO IMPLEMENTADO**

---

## ⚠️ DECLARACIÓN ABSOLUTA

### ❌ NADA HA SIDO IMPLEMENTADO

- ❌ NO se tocó código
- ❌ NO se tocó base de datos
- ❌ NO se tocó Stripe
- ❌ NO se tocó checkout
- ❌ NO se tocó webhook
- ❌ NO se tocó admin
- ❌ NO se tocó UI
- ❌ NO se ejecutó ningún SQL
- ❌ NO se aplicaron migraciones
- ❌ NO se crearon endpoints
- ❌ NO se modificaron archivos

**Este documento es SOLO propuesta técnica para revisión y aprobación.**

---

## 1. OBJETIVO EXACTO

Permitir que una clienta **pague todo el saldo pendiente de su apartado** de una sola vez, completando anticipadamente el plan de pagos y creando automáticamente la orden final para proceder con el envío del producto.

**Diferencia clave vs pago de cuota:**
- **Pago de cuota:** Paga la próxima cuota pendiente (ej: $21,000 de $189,000)
- **Pago de saldo completo:** Paga TODO el saldo restante de una vez (ej: $84,000 de $189,000)

**Resultado esperado:**
- Todas las cuotas pendientes marcadas como `paid`
- Apartado marcado como `completed`
- Orden final creada automáticamente
- Producto marcado como `sold`
- Stock actualizado a `0`
- Tracking token generado
- Orden visible en "Mis pedidos"

---

## 2. QUÉ PASA CUANDO UNA CLIENTA PAGA TODO EL SALDO PENDIENTE

### Escenario típico:

**Estado inicial:**
- Apartado: Chanel Classic Flap Negro ($189,000 MXN)
- Plan: 8 pagos semanales
- Progreso: 4/8 pagos completados
- Pagado: $105,000
- **Saldo pendiente: $84,000**
- Cuotas restantes: 4 (cuota #5, #6, #7, #8 — cada una $21,000)
- Status: `active`

**Acción:**
- Clienta hace click en **"Pagar saldo completo — $84,000 MXN"**
- Redirige a Stripe Checkout
- Paga $84,000 con tarjeta
- Pago exitoso

**Resultado:**
- **Layaway:**
  - `amount_paid`: $105,000 → $189,000
  - `amount_remaining`: $84,000 → $0
  - `payments_completed`: 4 → 8
  - `payments_remaining`: 4 → 0
  - `status`: `active` → `completed`
  - `completed_at`: timestamp actual
  - `last_payment_at`: timestamp actual
- **Layaway Payments (cuotas #5, #6, #7, #8):**
  - `status`: `pending` → `paid`
  - `amount_paid`: NULL → $21,000 (cada una)
  - `paid_at`: NULL → timestamp actual
  - `stripe_session_id`: NULL → [session.id]
  - `stripe_payment_intent_id`: NULL → [session.payment_intent]
- **Order:**
  - Se crea orden nueva
  - `customer_name`, `customer_email`, `customer_phone` del layaway
  - `total`: $189,000
  - `status`: `confirmed`
  - `payment_status`: `paid`
  - `layaway_id`: [id del apartado]
  - `stripe_session_id`: session de pago de saldo
  - `tracking_token`: generado automáticamente
- **Order Item:**
  - Se crea item vinculado a la orden
  - `product_id`: producto del apartado
  - `quantity`: 1
  - `unit_price`: $189,000
- **Product:**
  - `status`: `reserved` → `sold`
  - `stock`: 1 → 0
- **Layaway (actualización final):**
  - `order_id`: [id de la orden creada]

---

## 3. ESTRATEGIA: DISTRIBUIR PAGO ENTRE CUOTAS PENDIENTES ✅

### DECISIÓN OFICIAL (MVP):

**NO crear payment extra.**  
**NO usar status "waived".**  
**NO hacer migración DB.**

En su lugar:
- Obtener todas las cuotas con `status IN ('pending', 'overdue')`
- Marcarlas como `paid`
- Asignar `amount_paid = amount_due` a cada una
- Asignar mismo `stripe_session_id` y `stripe_payment_intent_id` a todas
- Asignar mismo `paid_at` a todas

**Ejemplo:**

```sql
-- Estado inicial de cuotas pendientes
SELECT payment_number, amount_due, status
FROM layaway_payments
WHERE layaway_id = '[layaway_id]'
  AND status IN ('pending', 'overdue');

-- Resultado:
-- payment_number | amount_due | status
-- 5              | 21000      | pending
-- 6              | 21000      | pending
-- 7              | 21000      | pending
-- 8              | 21000      | pending
-- Total: $84,000

-- Después de pagar saldo completo:
UPDATE layaway_payments
SET 
  status = 'paid',
  amount_paid = amount_due,
  paid_at = NOW(),
  stripe_session_id = 'cs_test_xyz123',
  stripe_payment_intent_id = 'pi_xyz456',
  updated_at = NOW()
WHERE layaway_id = '[layaway_id]'
  AND status IN ('pending', 'overdue');

-- Resultado:
-- payment_number | amount_due | amount_paid | status | paid_at
-- 5              | 21000      | 21000       | paid   | 2026-05-03 09:15:00
-- 6              | 21000      | 21000       | paid   | 2026-05-03 09:15:00
-- 7              | 21000      | 21000       | paid   | 2026-05-03 09:15:00
-- 8              | 21000      | 21000       | paid   | 2026-05-03 09:15:00
```

### Visualización en UI:

```
HISTORIAL DE PAGOS:
✅ Pago 1: $21,000 — 01 May 2026 — Pagado
✅ Pago 2: $21,000 — 08 May 2026 — Pagado
✅ Pago 3: $21,000 — 15 May 2026 — Pagado
✅ Pago 4: $21,000 — 22 May 2026 — Pagado
✅ Pago 5: $21,000 — 03 May 2026 — Pagado (liquidación anticipada)
✅ Pago 6: $21,000 — 03 May 2026 — Pagado (liquidación anticipada)
✅ Pago 7: $21,000 — 03 May 2026 — Pagado (liquidación anticipada)
✅ Pago 8: $21,000 — 03 May 2026 — Pagado (liquidación anticipada)

TOTAL PAGADO: $189,000 ✅
```

**Ventajas MVP:**
- ✅ No requiere migración DB
- ✅ No agrega complejidad con nuevos statuses
- ✅ Historial claro: 8 cuotas pagadas (4 normales + 4 anticipadas)
- ✅ Fácil de entender: "Todas las cuotas quedaron pagadas"
- ✅ Mismo `payment_type` existente (installment)

---

## 4. CÓMO EVITAR DOBLE CONTEO

### Problema potencial:
Si el webhook se ejecuta 2 veces, podría intentar marcar las mismas cuotas como paid dos veces.

### Solución — Idempotencia:

**Check #1: Layaway ya completed**
```javascript
if (layaway.status === 'completed') {
  console.log('[WEBHOOK FULL BALANCE] ✓ Already completed (IDEMPOTENT)')
  return  // Early return
}
```

**Check #2: Todas las cuotas ya están paid**
```javascript
const { data: pendingPayments } = await supabaseAdmin
  .from('layaway_payments')
  .select('id')
  .eq('layaway_id', layaway_id)
  .in('status', ['pending', 'overdue'])

if (!pendingPayments || pendingPayments.length === 0) {
  console.log('[WEBHOOK FULL BALANCE] ✓ All payments already paid (IDEMPOTENT)')
  return  // Early return
}
```

**Check #3: Orden ya existe**
```javascript
if (layaway.order_id) {
  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('id', layaway.order_id)
    .single()
  
  if (existingOrder) {
    console.log('[WEBHOOK FULL BALANCE] ✓ Order already exists (IDEMPOTENT)')
    return  // Early return
  }
}
```

**Orden de ejecución:**
1. Buscar layaway
2. Check #1: status === 'completed' → early return
3. Check #2: no pending payments → early return
4. Check #3: order_id exists → early return
5. Si ningún check dispara → procesar normalmente

**Logging:**
Cada early return debe loggear:
- Timestamp
- layaway_id
- session_id
- Razón del early return

**No retornar error**, solo early return silencioso (webhook siempre responde 200 OK).

---

## 5. CÓMO SE ASIGNA EL MISMO SESSION_ID/PAYMENT_INTENT A VARIAS CUOTAS

### Implementación en webhook:

```javascript
async function handleLayawayFullBalance(session: Stripe.Checkout.Session) {
  const layaway_id = session.metadata?.layaway_id
  const amount_remaining = parseFloat(session.metadata?.amount_remaining || '0')
  
  // ... validaciones de idempotencia ...
  
  // Obtener cuotas pendientes
  const { data: pendingPayments, error: fetchError } = await supabaseAdmin
    .from('layaway_payments')
    .select('*')
    .eq('layaway_id', layaway_id)
    .in('status', ['pending', 'overdue'])
    .order('payment_number', { ascending: true })
  
  if (fetchError || !pendingPayments || pendingPayments.length === 0) {
    console.error('[WEBHOOK FULL BALANCE] ERROR: No pending payments found')
    return
  }
  
  console.log(`[WEBHOOK FULL BALANCE] Found ${pendingPayments.length} pending payments to mark as paid`)
  
  // Marcar todas como paid con el mismo session_id/payment_intent
  const { error: updateError } = await supabaseAdmin
    .from('layaway_payments')
    .update({
      status: 'paid',
      amount_paid: supabase.raw('amount_due'),  // amount_paid = amount_due
      paid_at: new Date().toISOString(),
      stripe_session_id: session.id,  // ← Mismo para todas
      stripe_payment_intent_id: session.payment_intent as string || null,  // ← Mismo para todas
      updated_at: new Date().toISOString()
    })
    .eq('layaway_id', layaway_id)
    .in('status', ['pending', 'overdue'])
  
  if (updateError) {
    console.error('[WEBHOOK FULL BALANCE] ERROR updating payments:', updateError)
    return
  }
  
  console.log(`[WEBHOOK FULL BALANCE] ✓ ${pendingPayments.length} payments marked as paid`)
  
  // Continuar con recálculo de layaway...
}
```

**Resultado en DB:**

```
layaway_payments:
id | payment_number | amount_due | amount_paid | status | stripe_session_id      | stripe_payment_intent_id
1  | 1              | 21000      | 21000       | paid   | cs_test_abc111         | pi_abc111
2  | 2              | 21000      | 21000       | paid   | cs_test_abc222         | pi_abc222
3  | 3              | 21000      | 21000       | paid   | cs_test_abc333         | pi_abc333
4  | 4              | 21000      | 21000       | paid   | cs_test_abc444         | pi_abc444
5  | 5              | 21000      | 21000       | paid   | cs_test_xyz123         | pi_xyz456  ← Mismo ID
6  | 6              | 21000      | 21000       | paid   | cs_test_xyz123         | pi_xyz456  ← Mismo ID
7  | 7              | 21000      | 21000       | paid   | cs_test_xyz123         | pi_xyz456  ← Mismo ID
8  | 8              | 21000      | 21000       | paid   | cs_test_xyz123         | pi_xyz456  ← Mismo ID
```

**Interpretación:**
- Cuotas 1-4: Pagadas individualmente (cada una tiene su propia session)
- Cuotas 5-8: Pagadas juntas con pago de saldo completo (comparten session_id)

**Ventaja:**
- Auditoría clara: puedes identificar cuáles cuotas fueron pagadas anticipadamente buscando `stripe_session_id` repetido
- Query para identificar pagos de saldo completo:
  ```sql
  SELECT stripe_session_id, COUNT(*) as payments_count
  FROM layaway_payments
  WHERE layaway_id = '[layaway_id]'
    AND status = 'paid'
  GROUP BY stripe_session_id
  HAVING COUNT(*) > 1;
  ```

---

## 6. VALIDACIÓN: SUMA DE CUOTAS PENDIENTES = AMOUNT_REMAINING

### Pre-validación antes de marcar como paid:

```javascript
// 1. Obtener cuotas pendientes
const { data: pendingPayments } = await supabaseAdmin
  .from('layaway_payments')
  .select('payment_number, amount_due')
  .eq('layaway_id', layaway_id)
  .in('status', ['pending', 'overdue'])

// 2. Calcular suma de cuotas pendientes
const sumPendingPayments = pendingPayments.reduce((sum, p) => sum + p.amount_due, 0)

console.log('[WEBHOOK FULL BALANCE] Validation:', {
  layaway_amount_remaining: layaway.amount_remaining,
  sum_pending_payments: sumPendingPayments,
  difference: sumPendingPayments - layaway.amount_remaining
})

// 3. Validar que coincidan (con tolerancia para redondeo)
const tolerance = 1  // 1 peso de tolerancia
const diff = Math.abs(sumPendingPayments - layaway.amount_remaining)

if (diff > tolerance) {
  console.error('[WEBHOOK FULL BALANCE] ERROR: Sum mismatch:', {
    expected: layaway.amount_remaining,
    actual: sumPendingPayments,
    difference: diff,
    pending_payments: pendingPayments
  })
  // Loggear pero continuar (Stripe ya cobró, no podemos rechazar)
}

// 4. Validar que el monto cobrado por Stripe coincide
const stripeAmountMXN = (session.amount_total || 0) / 100  // Stripe está en centavos
const expectedAmountMXN = layaway.amount_remaining

if (Math.abs(stripeAmountMXN - expectedAmountMXN) > tolerance) {
  console.error('[WEBHOOK FULL BALANCE] ERROR: Stripe amount mismatch:', {
    expected_mxn: expectedAmountMXN,
    stripe_charged_mxn: stripeAmountMXN,
    difference: stripeAmountMXN - expectedAmountMXN
  })
  // Loggear pero continuar
}

// Si las validaciones pasan, continuar con UPDATE
```

**Casos a manejar:**

**Caso 1: Suma exacta (happy path)**
```
layaway.amount_remaining = 84000
sum(pending.amount_due) = 84000
difference = 0
→ PASS ✅
```

**Caso 2: Diferencia por redondeo**
```
layaway.amount_remaining = 84000.50
sum(pending.amount_due) = 84000
difference = 0.50
→ PASS (< 1 peso de tolerancia) ⚠️
```

**Caso 3: Diferencia significativa**
```
layaway.amount_remaining = 84000
sum(pending.amount_due) = 80000
difference = 4000
→ ERROR ❌ (loggear pero continuar)
```

---

## 7. QUÉ PASA SI HAY DIFERENCIA POR REDONDEO

### Política oficial:

**Si hay diferencia < $1 MXN:**
- ✅ Continuar normalmente
- ⚠️ Loggear warning con detalles
- No bloquear el flujo

**Si hay diferencia >= $1 MXN:**
- ❌ Loggear ERROR con detalles
- ✅ Continuar de todas formas (Stripe ya cobró, no podemos rechazar)
- 🔔 Notificar a admin (futuro: webhook a Telegram o email)
- 🔍 Admin investiga manualmente

### Logging recomendado:

```javascript
if (diff > 0.01) {  // Más de 1 centavo
  const logLevel = diff >= 1 ? 'ERROR' : 'WARNING'
  
  console.log(`[WEBHOOK FULL BALANCE] ${logLevel}: Amount mismatch detected`, {
    layaway_id: layaway.id,
    layaway_amount_remaining: layaway.amount_remaining,
    sum_pending_payments: sumPendingPayments,
    difference: diff,
    stripe_session_id: session.id,
    stripe_amount_charged: (session.amount_total || 0) / 100,
    pending_payments_count: pendingPayments.length,
    pending_payments: pendingPayments.map(p => ({
      payment_number: p.payment_number,
      amount_due: p.amount_due
    })),
    timestamp: new Date().toISOString()
  })
  
  // TODO: Enviar notificación a admin si diff >= 1
}
```

### Casos edge:

**Escenario 1: Redondeo en plan de 8 pagos**
```
Total: $189,000
Pagos: 8
Por cuota: $23,625 (189000 / 8)

Pero si se creó con redondeo:
Cuota 1-7: $23,625
Cuota 8: $23,625 (ajuste)
Sum: $189,000 ✅
```

**Escenario 2: Plan desbalanceado (error previo)**
```
Total: $189,000
Cuotas creadas incorrectamente:
Cuota 1-7: $24,000
Cuota 8: $21,000
Sum: $189,000 ✅ (total correcto)

Pero si pagó 4 cuotas de $24,000:
Pagado: $96,000
Restante: $93,000 (esperado)

Pero sum(cuotas pendientes 5-8):
Cuota 5-7: $24,000 = $72,000
Cuota 8: $21,000
Sum: $93,000 ✅ (coincide!)
```

**Conclusión:** Si el plan se creó correctamente, la suma SIEMPRE debería coincidir. Si no coincide, es señal de bug previo.

---

## 8. RECÁLCULO DEL LAYAWAY

### Lógica de recálculo tras pagar saldo completo:

```javascript
// 1. Obtener TODOS los payments del layaway (ahora todos deberían estar paid)
const { data: allPayments } = await supabaseAdmin
  .from('layaway_payments')
  .select('amount_paid, status')
  .eq('layaway_id', layaway_id)
  .order('payment_number', { ascending: true })

// 2. Calcular totales
const paidPayments = allPayments.filter(p => p.status === 'paid')
const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0)
const paymentsCompleted = paidPayments.length

// 3. Calcular restantes
const amountRemaining = (layaway.total_amount || 0) - totalPaid
const paymentsRemaining = (layaway.total_payments || 0) - paymentsCompleted

// 4. Determinar si se completó
const isCompleted = amountRemaining <= 0 && paymentsRemaining <= 0

console.log('[WEBHOOK FULL BALANCE] Recalculated amounts:', {
  total_amount: layaway.total_amount,
  amount_paid: totalPaid,
  amount_remaining: Math.max(amountRemaining, 0),
  total_payments: layaway.total_payments,
  payments_completed: paymentsCompleted,
  payments_remaining: Math.max(paymentsRemaining, 0),
  is_completed: isCompleted
})

// 5. Actualizar layaway
const newStatus = isCompleted ? 'completed' : 'active'

await supabaseAdmin
  .from('layaways')
  .update({
    amount_paid: totalPaid,
    amount_remaining: Math.max(amountRemaining, 0),
    payments_completed: paymentsCompleted,
    payments_remaining: Math.max(paymentsRemaining, 0),
    next_payment_due_date: null,  // Ya no hay próximo pago
    next_payment_amount: null,
    last_payment_at: new Date().toISOString(),
    consecutive_weeks_without_payment: 0,
    status: newStatus,
    completed_at: isCompleted ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  })
  .eq('id', layaway_id)

console.log(`[WEBHOOK FULL BALANCE] ✓ Layaway updated to status: ${newStatus}`)
```

**Valores esperados tras pago de saldo completo:**

```
layaway:
  amount_paid: 189000 (antes: 105000)
  amount_remaining: 0 (antes: 84000)
  payments_completed: 8 (antes: 4)
  payments_remaining: 0 (antes: 4)
  next_payment_due_date: NULL
  next_payment_amount: NULL
  status: completed
  completed_at: 2026-05-03T09:15:00Z
```

---

## 9. CUÁNDO SE MARCA LAYAWAY.COMPLETED

### Condición exacta:

```javascript
const isCompleted = 
  amountRemaining <= 0 && 
  paymentsRemaining <= 0 &&
  allPayments.every(p => p.status === 'paid')

if (isCompleted) {
  newStatus = 'completed'
  completedAt = new Date().toISOString()
}
```

**Criterios:**
- `amount_remaining` <= 0
- `payments_remaining` <= 0
- Todos los payments tienen `status = 'paid'`

**Se marca completed por:**
- Pago de última cuota normal (cuota #8 en plan de 8)
- Pago de saldo completo anticipado (cualquier momento)

**NO se marca completed si:**
- Aún hay `amount_remaining` > 0
- Aún hay payments con status `pending` o `overdue`

---

## 10. CUÁNDO SE CREA ORDER FINAL

### Trigger: Layaway pasa a `status = 'completed'`

**En webhook, después de actualizar layaway:**

```javascript
// Si layaway se completó, crear orden
if (newStatus === 'completed') {
  const order = await createOrderFromLayaway(layaway, session)
  
  if (!order) {
    console.error('[WEBHOOK FULL BALANCE] ERROR: Failed to create order')
    // TODO: Retry logic o notificación a admin
    return
  }
  
  console.log(`[WEBHOOK FULL BALANCE] ✓ Order created: ${order.id}`)
}
```

**Función propuesta:**

```javascript
async function createOrderFromLayaway(layaway, session) {
  // 1. Generar tracking token único
  const trackingToken = await generateUniqueTrackingToken()
  
  // 2. Crear orden
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: layaway.user_id || null,
      customer_name: layaway.customer_name,
      customer_email: layaway.customer_email,
      customer_phone: layaway.customer_phone,
      total: layaway.total_amount,
      subtotal: layaway.total_amount,
      shipping: 0,
      status: 'confirmed',
      payment_status: 'paid',
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
    console.error('[WEBHOOK FULL BALANCE] ERROR creating order:', orderError)
    return null
  }
  
  console.log('[WEBHOOK FULL BALANCE] ✓ Order created:', order.id)
  
  // 3. Crear order_item
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
    console.error('[WEBHOOK FULL BALANCE] ERROR creating order_item:', itemError)
    // No retornar null, orden ya fue creada
  } else {
    console.log('[WEBHOOK FULL BALANCE] ✓ Order item created')
  }
  
  // 4. Actualizar layaway con order_id
  await supabaseAdmin
    .from('layaways')
    .update({ 
      order_id: order.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', layaway.id)
  
  console.log('[WEBHOOK FULL BALANCE] ✓ Layaway linked to order')
  
  // 5. Actualizar product: reserved → sold, stock → 0
  const { error: productError } = await supabaseAdmin
    .from('products')
    .update({ 
      status: 'sold', 
      stock: 0,
      updated_at: new Date().toISOString()
    })
    .eq('id', layaway.product_id)
  
  if (productError) {
    console.error('[WEBHOOK FULL BALANCE] ERROR updating product:', productError)
  } else {
    console.log('[WEBHOOK FULL BALANCE] ✓ Product marked as sold')
  }
  
  return order
}
```

**Momento exacto:**
- Se ejecuta **dentro del webhook** tras marcar layaway como `completed`
- Garantiza que orden se crea inmediatamente tras completar apartado
- Evita estados inconsistentes (apartado completo sin orden)

---

## 11. CÓMO SE CREA ORDER_ITEM

### SQL Insert (parte de createOrderFromLayaway):

```sql
INSERT INTO order_items (
  order_id,
  product_id,
  quantity,
  unit_price,
  created_at,
  updated_at
) VALUES (
  '[order.id]',
  '[layaway.product_id]',
  1,  -- Siempre 1 producto por apartado (Fase 1)
  '[layaway.total_amount]',  -- $189,000
  NOW(),
  NOW()
);
```

**Valores:**
- `order_id`: ID de la orden recién creada
- `product_id`: ID del producto apartado
- `quantity`: Siempre 1 (productos de lujo son únicos)
- `unit_price`: `layaway.total_amount` (precio total del apartado)

**RLS Policies:**
- Usuario puede ver order_items de sus propias orders
- Admin puede ver todos

---

## 12. CÓMO SE ACTUALIZA PRODUCT.STATUS A SOLD

### SQL Update (parte de createOrderFromLayaway):

```sql
UPDATE products
SET 
  status = 'sold',
  stock = 0,
  updated_at = NOW()
WHERE id = '[layaway.product_id]';
```

**Momento:**
- Ejecuta **después** de crear orden
- Ejecuta **dentro del webhook**
- Ejecuta **solo si orden se creó exitosamente**

**Validación previa (opcional):**
```javascript
// Antes de actualizar, verificar estado actual
const { data: product } = await supabaseAdmin
  .from('products')
  .select('status, stock')
  .eq('id', layaway.product_id)
  .single()

if (product.status !== 'reserved') {
  console.warn('[WEBHOOK FULL BALANCE] WARNING: Product not reserved:', {
    expected_status: 'reserved',
    actual_status: product.status,
    product_id: layaway.product_id
  })
  // Proceder igual pero loggear advertencia
}
```

**Casos edge:**
- Si product ya está `sold`: Loggear warning pero no fallar (idempotencia)
- Si product está `available`: ERROR, investigar inconsistencia (alguien lo modificó manualmente)

---

## 13. CÓMO SE GENERA TRACKING_TOKEN

### Función reutilizable:

```javascript
function generateTrackingToken() {
  // Formato: 8 caracteres alfanuméricos uppercase
  // Ejemplo: "A3F7K2M9"
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Sin confusos: I, O, 0, 1
  let token = ''
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
```

**Características:**
- 8 caracteres
- Solo uppercase + números
- Sin caracteres confusos (I/1, O/0)
- Único por orden
- Usado en `/track/[tracking_token]`

**Validación de unicidad:**

```javascript
async function generateUniqueTrackingToken() {
  let token
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    token = generateTrackingToken()
    
    // Verificar si ya existe
    const { data } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('tracking_token', token)
      .single()
    
    if (!data) {
      return token  // Token único encontrado
    }
    
    attempts++
  }
  
  // Fallback: agregar timestamp
  return generateTrackingToken() + Date.now().toString().slice(-4)
}
```

---

## 14. CÓMO APARECE EN "MIS PEDIDOS"

### UI Resultado:

```
MIS PEDIDOS:

┌──────────────────────────────────────────────────────────┐
│ Pedido #A3F7K2M9                          3 May 2026     │
│                                                           │
│ [Imagen] Chanel Classic Flap Negro                       │
│                                                           │
│ Total: $189,000 MXN                                      │
│ Estado: Confirmado ✅                                     │
│ Pago: Pagado ✅                                           │
│                                                           │
│ 🎁 Este pedido proviene de tu apartado completado        │
│                                                           │
│ [Ver detalles del pedido]                                │
└──────────────────────────────────────────────────────────┘
```

**Datos mostrados:**
- `tracking_token`: A3F7K2M9
- `customer_name`: [nombre del layaway]
- `total`: $189,000
- `status`: confirmed
- `payment_status`: paid
- `created_at`: 03 May 2026
- Producto: Chanel Classic Flap Negro
- Badge especial: "Pedido de apartado"

**Query:**

```sql
SELECT 
  o.*,
  oi.product_id,
  p.title,
  p.brand,
  pi.url as image_url,
  l.id as layaway_id
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN products p ON p.id = oi.product_id
LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.display_order = 1
LEFT JOIN layaways l ON l.id = o.layaway_id
WHERE o.user_id = '[user_id]'
  OR o.customer_email = '[user_email]'
ORDER BY o.created_at DESC;
```

**Vínculo a apartado original:**
- Si `order.layaway_id` existe: Mostrar badge "De apartado"
- Click en badge: Redirige a `/account/layaways/[layaway_id]`

---

## 15. METADATA STRIPE PROPUESTA

### Session metadata:

```javascript
metadata: {
  type: 'layaway_full_balance',  // ← Nuevo tipo
  layaway_id: layaway.id,
  user_id: userId,
  customer_email: layaway.customer_email,
  amount_remaining: layaway.amount_remaining.toString(),
  total_amount: layaway.total_amount.toString(),
  payments_completed_before: layaway.payments_completed.toString(),
  total_payments: layaway.total_payments.toString(),
  product_id: layaway.product_id,
  plan_type: layaway.plan_type
}
```

**Campos clave:**
- `type: 'layaway_full_balance'` — Identifica webhook handler correcto
- `layaway_id` — ID del apartado
- `amount_remaining` — Saldo que se está pagando
- `payments_completed_before` — Cuántas cuotas ya había pagado antes

**Uso en webhook:**
```javascript
if (session.metadata.type === 'layaway_full_balance') {
  await handleLayawayFullBalance(session)
}
```

---

## 16. ENDPOINT PROPUESTO

### Ruta: `POST /api/layaways/[id]/pay-balance`

**Archivo:** `src/app/api/layaways/[id]/pay-balance/route.ts`

**Responsabilidades:**
1. Autenticación (Bearer token)
2. Validar ownership del layaway
3. Validar estado del layaway (active/overdue)
4. Validar que `amount_remaining > 0`
5. Crear Stripe Checkout Session con metadata correcto
6. Retornar `checkout_url`

**Estructura (pseudocódigo):**

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: layawayId } = await params
  
  // 1. Autenticar
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // 2. Buscar layaway
  const { data: layaway, error } = await supabaseAdmin
    .from('layaways')
    .select(`
      id,
      user_id,
      customer_email,
      customer_name,
      product_id,
      status,
      total_amount,
      amount_paid,
      amount_remaining,
      total_payments,
      payments_completed,
      plan_type,
      currency,
      product:products(id, title, brand)
    `)
    .eq('id', layawayId)
    .single()
  
  if (error || !layaway) {
    return NextResponse.json({ error: 'Layaway not found' }, { status: 404 })
  }
  
  // 3. Validar ownership
  const ownsLayaway = 
    layaway.user_id === user.id || 
    layaway.customer_email === user.email
  
  if (!ownsLayaway) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // 4. Validar estado
  if (!['active', 'overdue'].includes(layaway.status)) {
    return NextResponse.json({ 
      error: `Cannot pay balance. Layaway is ${layaway.status}` 
    }, { status: 400 })
  }
  
  // 5. Validar saldo pendiente
  if (layaway.amount_remaining <= 0) {
    return NextResponse.json({ 
      error: 'No balance remaining' 
    }, { status: 400 })
  }
  
  // 6. Crear Stripe session
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bagclue.vercel.app'
  const product = Array.isArray(layaway.product) ? layaway.product[0] : layaway.product
  
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: (layaway.currency || 'MXN').toLowerCase(),
        product_data: {
          name: `Saldo completo: ${product?.brand || ''} ${product?.title || 'Producto'}`,
          description: `Liquidación total del apartado`,
          images: []
        },
        unit_amount: Math.round(layaway.amount_remaining * 100)
      },
      quantity: 1
    }],
    customer_email: layaway.customer_email,
    metadata: {
      type: 'layaway_full_balance',
      layaway_id: layaway.id,
      user_id: user.id,
      customer_email: layaway.customer_email,
      amount_remaining: layaway.amount_remaining.toString(),
      total_amount: layaway.total_amount.toString(),
      payments_completed_before: layaway.payments_completed.toString(),
      total_payments: layaway.total_payments.toString(),
      product_id: layaway.product_id,
      plan_type: layaway.plan_type || ''
    },
    success_url: `${baseUrl}/account/layaways/${layaway.id}?payment_success=true&balance_paid=true`,
    cancel_url: `${baseUrl}/account/layaways/${layaway.id}?payment_cancelled=true`,
    expires_at: Math.floor(Date.now() / 1000) + (30 * 60)
  })
  
  // 7. Retornar URL
  return NextResponse.json({
    checkout_url: session.url,
    session_id: session.id,
    amount_due: layaway.amount_remaining,
    currency: layaway.currency || 'MXN',
    expires_at: new Date(session.expires_at! * 1000).toISOString(),
    message: 'Balance payment session created successfully'
  })
}
```

**Validaciones adicionales:**
- Si layaway ya está `completed`: 400 "Layaway already completed"
- Si layaway está `cancelled`: 400 "Layaway is cancelled"
- Si `amount_remaining` es NULL: 400 "Invalid layaway state"

---

## 17. CAMBIOS NECESARIOS EN WEBHOOK

### Archivo: `src/app/api/stripe/webhook/route.ts`

**Agregar nuevo case en dispatcher:**

```typescript
switch (event.type) {
  case 'checkout.session.completed': {
    const session = event.data.object as Stripe.Checkout.Session
    const metadata_type = session.metadata?.type
    
    // Handle layaway full balance payment (NEW - Fase 5C.3B.4)
    if (metadata_type === 'layaway_full_balance') {
      await handleLayawayFullBalance(session)
      return
    }
    
    // Handle layaway installment payment (Existing - Fase 5C.3B.2)
    if (metadata_type === 'layaway_installment') {
      await handleLayawayInstallment(session)
      return
    }
    
    // ... resto de handlers
  }
}
```

**Implementar handler nuevo:**

```typescript
async function handleLayawayFullBalance(session: Stripe.Checkout.Session) {
  const layaway_id = session.metadata?.layaway_id
  const amount_remaining = parseFloat(session.metadata?.amount_remaining || '0')
  
  console.log(`[WEBHOOK FULL BALANCE] Processing full balance payment for layaway: ${layaway_id}`)
  
  // === VALIDACIÓN 1: metadata.layaway_id exists ===
  if (!layaway_id) {
    console.error('[WEBHOOK FULL BALANCE] ERROR: Missing layaway_id')
    return
  }
  
  // === VALIDACIÓN 2: Buscar layaway ===
  const { data: layaway, error: fetchError } = await supabaseAdmin
    .from('layaways')
    .select('*')
    .eq('id', layaway_id)
    .single()
  
  if (fetchError || !layaway) {
    console.error('[WEBHOOK FULL BALANCE] ERROR: Layaway not found:', fetchError?.message)
    return
  }
  
  console.log('[WEBHOOK FULL BALANCE] Layaway found:', {
    layaway_id: layaway.id,
    status: layaway.status,
    amount_remaining: layaway.amount_remaining
  })
  
  // === IDEMPOTENCIA CHECK #1: Layaway ya completed ===
  if (layaway.status === 'completed') {
    console.log('[WEBHOOK FULL BALANCE] ✓ Layaway already completed (IDEMPOTENT - early return)')
    return
  }
  
  // === IDEMPOTENCIA CHECK #2: Orden ya existe ===
  if (layaway.order_id) {
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('id', layaway.order_id)
      .single()
    
    if (existingOrder) {
      console.log('[WEBHOOK FULL BALANCE] ✓ Order already exists (IDEMPOTENT - early return)')
      return
    }
  }
  
  // === VALIDACIÓN 3: session.payment_status === 'paid' ===
  if (session.payment_status !== 'paid') {
    console.error('[WEBHOOK FULL BALANCE] ERROR: Session not paid:', session.payment_status)
    return
  }
  
  // === VALIDACIÓN 4: Obtener cuotas pendientes ===
  const { data: pendingPayments, error: pendingError } = await supabaseAdmin
    .from('layaway_payments')
    .select('*')
    .eq('layaway_id', layaway_id)
    .in('status', ['pending', 'overdue'])
    .order('payment_number', { ascending: true })
  
  if (pendingError || !pendingPayments || pendingPayments.length === 0) {
    console.log('[WEBHOOK FULL BALANCE] ✓ No pending payments found (IDEMPOTENT - early return)')
    return
  }
  
  console.log(`[WEBHOOK FULL BALANCE] Found ${pendingPayments.length} pending payments`)
  
  // === VALIDACIÓN 5: Verificar suma de cuotas pendientes ===
  const sumPendingPayments = pendingPayments.reduce((sum, p) => sum + p.amount_due, 0)
  const diff = Math.abs(sumPendingPayments - layaway.amount_remaining)
  
  console.log('[WEBHOOK FULL BALANCE] Validation:', {
    layaway_amount_remaining: layaway.amount_remaining,
    sum_pending_payments: sumPendingPayments,
    difference: diff
  })
  
  if (diff > 1) {  // Tolerancia de $1 MXN
    console.error('[WEBHOOK FULL BALANCE] ERROR: Sum mismatch:', {
      expected: layaway.amount_remaining,
      actual: sumPendingPayments,
      difference: diff
    })
    // Loggear pero continuar
  }
  
  // === VALIDACIÓN 6: Verificar monto cobrado por Stripe ===
  const stripeAmountMXN = (session.amount_total || 0) / 100
  if (Math.abs(stripeAmountMXN - layaway.amount_remaining) > 1) {
    console.error('[WEBHOOK FULL BALANCE] ERROR: Stripe amount mismatch:', {
      expected: layaway.amount_remaining,
      charged: stripeAmountMXN
    })
    // Loggear pero continuar
  }
  
  // === ACTUALIZACIÓN 1: Marcar todas las cuotas pendientes como paid ===
  console.log('[WEBHOOK FULL BALANCE] Marking pending payments as paid...')
  
  const { error: updatePaymentsError } = await supabaseAdmin
    .from('layaway_payments')
    .update({
      status: 'paid',
      amount_paid: supabase.raw('amount_due'),
      paid_at: new Date().toISOString(),
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string || null,
      updated_at: new Date().toISOString()
    })
    .eq('layaway_id', layaway_id)
    .in('status', ['pending', 'overdue'])
  
  if (updatePaymentsError) {
    console.error('[WEBHOOK FULL BALANCE] ERROR updating payments:', updatePaymentsError)
    return
  }
  
  console.log(`[WEBHOOK FULL BALANCE] ✓ ${pendingPayments.length} payments marked as paid`)
  
  // === RECALCULAR TOTALES ===
  const { data: allPayments } = await supabaseAdmin
    .from('layaway_payments')
    .select('amount_paid, status')
    .eq('layaway_id', layaway_id)
  
  const paidPayments = allPayments?.filter(p => p.status === 'paid') || []
  const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0)
  const paymentsCompleted = paidPayments.length
  const amountRemaining = Math.max((layaway.total_amount || 0) - totalPaid, 0)
  const paymentsRemaining = Math.max((layaway.total_payments || 0) - paymentsCompleted, 0)
  
  console.log('[WEBHOOK FULL BALANCE] Recalculated:', {
    amount_paid: totalPaid,
    amount_remaining: amountRemaining,
    payments_completed: paymentsCompleted,
    payments_remaining: paymentsRemaining
  })
  
  // === ACTUALIZACIÓN 2: Marcar layaway como completed ===
  console.log('[WEBHOOK FULL BALANCE] Updating layaway to completed...')
  
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
    .eq('id', layaway_id)
  
  if (updateLayawayError) {
    console.error('[WEBHOOK FULL BALANCE] ERROR updating layaway:', updateLayawayError)
    return
  }
  
  console.log('[WEBHOOK FULL BALANCE] ✓ Layaway marked as completed')
  
  // === CREACIÓN DE ORDEN FINAL ===
  const order = await createOrderFromLayaway(layaway, session)
  
  if (!order) {
    console.error('[WEBHOOK FULL BALANCE] ERROR: Failed to create order')
    return
  }
  
  console.log(`[WEBHOOK FULL BALANCE] SUCCESS: Layaway ${layaway_id} completed, order ${order.id} created`)
}
```

**Total cambios en webhook:**
- +1 case en dispatcher
- +1 handler function handleLayawayFullBalance (~120 líneas)
- Reutilizar función existente createOrderFromLayaway (ya definida en sección 10)

---

## 18. RIESGOS TÉCNICOS

### RIESGO 1: Race condition en webhook
**Descripción:** Si webhook se ejecuta 2 veces en paralelo, puede crear 2 órdenes.

**Mitigación:**
- Check idempotencia al inicio del handler (3 checks)
- Transaction SQL para marcar payments + actualizar layaway (considerar para futuro)
- Unique constraint en `orders.stripe_session_id` (considerar agregar)

**Severidad:** Media  
**Probabilidad:** Baja  
**Impacto:** Alto (orden duplicada, stock incorrecto)

---

### RIESGO 2: Suma de cuotas pendientes ≠ amount_remaining
**Descripción:** Por bug previo, la suma de cuotas pendientes no coincide con el saldo.

**Mitigación:**
- Validar suma antes de procesar
- Loggear discrepancia pero procesar igual (Stripe ya cobró)
- Tolerancia de $1 MXN para redondeo
- Admin investiga manualmente si diff >= $1

**Severidad:** Media  
**Probabilidad:** Muy baja  
**Impacto:** Medio (inconsistencia contable)

---

### RIESGO 3: Product no está en status 'reserved'
**Descripción:** Al completar apartado, product está en 'available' o 'sold'.

**Mitigación:**
- Loggear warning pero continuar
- Marcar como sold de todas formas
- Admin investiga inconsistencia después

**Severidad:** Baja  
**Probabilidad:** Muy baja  
**Impacto:** Bajo (inconsistencia temporal)

---

### RIESGO 4: Webhook falla después de marcar payments pero antes de crear orden
**Descripción:** Payments quedan en `paid` pero layaway no llega a `completed` ni se crea orden.

**Mitigación:**
- Orden de operaciones:
  1. Marcar payments como paid
  2. Actualizar layaway a completed
  3. Crear orden
- Si webhook falla en paso 2 o 3, Stripe reintentará automáticamente
- Checks de idempotencia evitan duplicados en retry

**Severidad:** Media  
**Probabilidad:** Baja  
**Impacto:** Medio (cliente pagó pero no tiene orden, se resuelve en retry)

---

### RIESGO 5: Token de tracking duplicado
**Descripción:** Genera tracking_token que ya existe en otra orden.

**Mitigación:**
- Check de unicidad antes de insertar orden
- Retry hasta 10 intentos
- Fallback: agregar timestamp al token

**Severidad:** Baja  
**Probabilidad:** Muy baja (1 en 1,000,000)  
**Impacto:** Medio (tracking no funciona, pero detectable)

---

### RIESGO 6: Usuario cierra navegador antes de completar pago
**Descripción:** Crea session pero nunca completa pago.

**Mitigación:**
- Session expira en 30 minutos automáticamente
- Stripe envía `checkout.session.expired` → No action needed
- UI permite crear nueva session

**Severidad:** Muy baja  
**Probabilidad:** Media  
**Impacto:** Ninguno (session simplemente expira)

---

## 19. SUBFASES PEQUEÑAS RECOMENDADAS (CORREGIDO)

### FASE 5C.3B.4A — Backend Stripe Session (pay-balance endpoint)
**Alcance:** Crear endpoint `/api/layaways/[id]/pay-balance` sin UI.

**Entregables:**
- `src/app/api/layaways/[id]/pay-balance/route.ts`
- Validaciones completas
- Metadata correcto (`type: 'layaway_full_balance'`)
- Tests con Postman/curl

**Validación:**
```bash
curl -X POST \
  -H "Authorization: Bearer [token]" \
  https://bagclue.vercel.app/api/layaways/[id]/pay-balance
```

**Resultado esperado:**
```json
{
  "checkout_url": "https://checkout.stripe.com/...",
  "session_id": "cs_test_...",
  "amount_due": 84000,
  "currency": "MXN"
}
```

**Sin tocar:**
- UI
- Webhook
- DB schema
- migrations

**Tiempo estimado:** 30-40 min

---

### FASE 5C.3B.4B — Webhook: Reconciliar full balance (marcar cuotas como paid)
**Alcance:** Implementar handler `handleLayawayFullBalance` que:
- Obtiene cuotas pendientes
- Valida suma vs amount_remaining
- Marca cuotas como `paid` con mismo session_id
- Actualiza layaway a `completed`
- **NO crea orden todavía**

**Entregables:**
- Handler function en webhook
- Logging completo
- Checks de idempotencia (3)
- Validación de suma
- Test con evento real de Stripe

**Validación:**
1. Pagar saldo completo desde endpoint 5C.3B.4A
2. Webhook procesa evento
3. Verificar en Supabase:
   - Cuotas #5-8: status=paid, amount_paid=21000 ✅
   - Mismo stripe_session_id en las 4 cuotas ✅
   - layaway.status = completed ✅
   - layaway.amount_paid = 189000 ✅
   - orders: 0 nuevas ✅ (todavía no se crean)

**Sin tocar:**
- Creación de orden
- Product.status
- Stock
- UI

**Tiempo estimado:** 45-60 min

---

### FASE 5C.3B.4C — Webhook: Crear orden final + product sold
**Alcance:** Implementar lógica de crear orden cuando layaway completed.

**Entregables:**
- Función `createOrderFromLayaway` (si no existe ya)
- Generación de tracking_token
- Creación de order_item
- Actualización de product → sold
- Actualización de stock → 0
- Vinculación layaway.order_id

**Validación:**
1. Pagar saldo completo
2. Webhook procesa
3. Verificar en Supabase:
   - Orden creada ✅
   - order_item creado ✅
   - product.status = sold ✅
   - product.stock = 0 ✅
   - layaway.order_id vinculado ✅
   - tracking_token generado ✅
4. Verificar en UI:
   - Orden aparece en "Mis pedidos" ✅

**Sin tocar:**
- UI de apartados (solo verificar lectura)
- Endpoint (ya hecho en 4A)
- Otros handlers

**Tiempo estimado:** 40-50 min

---

### FASE 5C.3B.4D — UI: Botón "Pagar saldo completo"
**Alcance:** Agregar botón en detalle de apartado.

**Entregables:**
- Botón en `src/app/account/layaways/[id]/page.tsx`
- Handler de click
- Loading state
- Error handling
- Success redirect

**UI propuesta:**
```tsx
{layaway.status === 'active' && layaway.amount_remaining > 0 && (
  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <h3 className="font-semibold text-blue-900 mb-2">
      💰 ¿Quieres terminar de pagar ahora?
    </h3>
    <p className="text-sm text-blue-700 mb-3">
      Liquida el saldo completo y recibe tu producto de inmediato.
    </p>
    <button
      onClick={handlePayBalance}
      disabled={balanceLoading}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
    >
      {balanceLoading ? (
        <span>Creando sesión de pago...</span>
      ) : (
        <span>
          Pagar saldo completo — {formatCurrency(layaway.amount_remaining)}
        </span>
      )}
    </button>
  </div>
)}
```

**Validación:**
1. Botón aparece solo si amount_remaining > 0 ✅
2. Click redirige a Stripe ✅
3. Pago exitoso ✅
4. Webhook procesa ✅
5. UI actualiza (apartado → completed) ✅
6. Orden aparece en "Mis pedidos" ✅

**Sin tocar:**
- Backend (ya hecho)
- Webhook (ya hecho)
- DB

**Tiempo estimado:** 30-40 min

---

### FASE 5C.3B.4E — Validación end-to-end completa
**Alcance:** Validación exhaustiva del flujo completo.

**Entregables:**
- Script de validación automatizado
- Documento de validación (checklist)
- Pruebas con diferentes escenarios

**Escenarios a validar:**

**Escenario 1: Pago de saldo completo en apartado activo (happy path)**
- Apartado: 4/8 pagos completados
- Acción: Pagar saldo completo ($84,000)
- Resultado esperado:
  - Layaway → completed ✅
  - Cuotas #5-8 → paid ✅
  - Mismo session_id en cuotas #5-8 ✅
  - Orden creada ✅
  - Product → sold ✅
  - Stock → 0 ✅
  - Tracking token generado ✅
  - Visible en "Mis pedidos" ✅

**Escenario 2: Pago de saldo completo con solo 1 cuota completada**
- Apartado: 1/8 pagos completados
- Acción: Pagar saldo completo ($168,000)
- Validar mismo resultado

**Escenario 3: Webhook duplicado (idempotencia)**
- Acción: Reenviar evento de Stripe 2 veces
- Resultado esperado:
  - Solo 1 orden creada ✅
  - Logs muestran "IDEMPOTENT" en segundo intento ✅

**Escenario 4: Usuario cancela pago en Stripe**
- Acción: Ir a Stripe pero no pagar, cerrar navegador
- Resultado esperado:
  - Session expira ✅
  - Layaway sigue en active ✅
  - UI permite reintentar ✅

**Escenario 5: Intentar pagar saldo completo en apartado completed**
- Apartado: completed
- Acción: Llamar endpoint pay-balance
- Resultado esperado:
  - 400 "Layaway already completed" ✅

**Sin tocar:**
- Código (solo validar)
- DB (solo leer)

**Tiempo estimado:** 45-60 min

---

## 20. RESUMEN DE SUBFASES (CORREGIDO)

| Subfase | Descripción | Tiempo est. | Deploy | Docs |
|---------|-------------|-------------|--------|------|
| 5C.3B.4A | Backend endpoint pay-balance | 30-40 min | ✅ | IMPLEMENTACION_4A.md |
| 5C.3B.4B | Webhook: marcar cuotas como paid | 45-60 min | ✅ | IMPLEMENTACION_4B.md |
| 5C.3B.4C | Webhook: crear orden final | 40-50 min | ✅ | IMPLEMENTACION_4C.md |
| 5C.3B.4D | UI: botón pagar saldo | 30-40 min | ✅ | IMPLEMENTACION_4D.md |
| 5C.3B.4E | Validación end-to-end | 45-60 min | ❌ | VALIDACION_4E.md |

**Total estimado:** 3-3.5 horas (dividido en 5 sesiones cortas)

**❌ NO SE REQUIERE MIGRACIÓN DB** — Se eliminó subfase 4B (migración waived)

---

## 21. ORDEN RECOMENDADO DE IMPLEMENTACIÓN

### DÍA 1:
1. ✅ 5C.3B.4A — Backend endpoint (30-40 min)
   - Implementar
   - Build local
   - Deploy
   - Test con curl/Postman
   - Validar checkout_url

**Total Día 1:** ~40 min

---

### DÍA 2:
2. ✅ 5C.3B.4B — Webhook marcar payments (45-60 min)
   - Implementar handler
   - Build local
   - Deploy
   - Test con Stripe event resend
   - Validar payments paid + layaway completed (NO orden todavía)

**Total Día 2:** ~1 hora

---

### DÍA 3:
3. ✅ 5C.3B.4C — Webhook crear orden (40-50 min)
   - Implementar createOrderFromLayaway
   - Build local
   - Deploy
   - Test end-to-end
   - Validar orden aparece en DB y "Mis pedidos"

**Total Día 3:** ~50 min

---

### DÍA 4:
4. ✅ 5C.3B.4D — UI botón (30-40 min)
   - Implementar botón
   - Build local
   - Deploy
   - Test visual en producción

5. ✅ 5C.3B.4E — Validación completa (45-60 min)
   - Script automatizado
   - 5 escenarios
   - Documentación final

**Total Día 4:** ~1.5 horas

---

**TOTAL PROYECTO:** 3-3.5 horas aprox (repartido en 4 días)

---

## 22. CHECKLIST PRE-IMPLEMENTACIÓN

Antes de comenzar **cualquier** subfase, verificar:

- [ ] FASE_5C3B4_SCOPE_PAGAR_SALDO_COMPLETO.md aprobado formalmente por Jhonatan
- [ ] Subfase específica aprobada para implementar
- [ ] Repo local sincronizado con remoto
- [ ] No hay cambios dirty sin commit
- [ ] Build local pasa antes de implementar
- [ ] Backups recientes de DB (menos de 24h)
- [ ] Stripe test mode activo
- [ ] Webhook secret correcto en Vercel
- [ ] Revisar DEPLOY_IDENTITY_GUARDRAILS.md

---

## 23. CRITERIOS DE ÉXITO FINAL

Fase 5C.3B.4 se considerará **CERRADA** cuando:

- [ ] Endpoint `/api/layaways/[id]/pay-balance` funciona ✅
- [ ] Webhook procesa `layaway_full_balance` correctamente ✅
- [ ] Cuotas pendientes se marcan como `paid` ✅
- [ ] Mismo `stripe_session_id` en todas las cuotas liquidadas ✅
- [ ] Layaway pasa a `completed` ✅
- [ ] Orden final se crea automáticamente ✅
- [ ] Order_item creado correctamente ✅
- [ ] Product → `sold`, stock → 0 ✅
- [ ] Tracking token generado ✅
- [ ] Orden aparece en "Mis pedidos" ✅
- [ ] UI botón "Pagar saldo completo" funciona ✅
- [ ] Idempotencia validada (webhook duplicado no crea 2 órdenes) ✅
- [ ] 5 escenarios de validación pasan ✅
- [ ] Build local exitoso ✅
- [ ] Deploy producción exitoso ✅
- [ ] No se tocaron áreas prohibidas (admin, checkout contado, schema no relacionado) ✅
- [ ] Documentación completa generada ✅
- [ ] **NO se hizo migración DB** ✅

**Total checks:** 18/18

---

## 24. CONFIRMACIONES FINALES

### ✅ CONFIRMADO: No se necesita migración para waived

- NO se agregará status "waived" a layaway_payments
- NO se modificará constraint layaway_payments_status_check
- NO se creará migración SQL
- Las cuotas pendientes se marcarán como `paid` directamente
- Schema actual es suficiente para MVP

### ✅ CONFIRMADO: Nada ha sido implementado

- ❌ NO se tocó código
- ❌ NO se tocó base de datos
- ❌ NO se tocó Stripe
- ❌ NO se tocó webhook
- ❌ NO se tocó UI
- ❌ NO se ejecutó ningún SQL
- ❌ NO se aplicaron migraciones
- ❌ NO se crearon endpoints
- ❌ NO se modificaron archivos

**Solo se actualizó este documento de scope.**

---

## 25. CONCLUSIÓN

Este documento define **COMPLETAMENTE** el scope de Fase 5C.3B.4 — Pagar saldo completo (VERSIÓN CORREGIDA).

**Cambios aplicados según feedback de Jhonatan:**
- ❌ Eliminado status "waived"
- ❌ Eliminado payment tipo "full_balance"
- ❌ Eliminada migración DB
- ✅ Estrategia: Marcar cuotas pendientes como "paid"
- ✅ Mismo session_id para todas las cuotas liquidadas
- ✅ Validación de suma de cuotas
- ✅ Tolerancia de redondeo ($1 MXN)
- ✅ Checks de idempotencia (3)
- ✅ Subfases ajustadas (5 en lugar de 6, sin migración)

**Próximo paso:**
- Jhonatan revisa este documento corregido
- Aprueba o pide ajustes adicionales
- Una vez aprobado, comenzar con Fase 5C.3B.4A (backend endpoint)

**NO implementar nada hasta aprobación formal.**

---

**Documento preparado por:** Kepler  
**Fecha:** 2026-05-03  
**Última actualización:** 2026-05-03 09:10 UTC  
**Proyecto:** Bagclue  
**Cliente:** Jhonatan Venegas  
**Status:** 📋 CORREGIDO - PENDIENTE APROBACIÓN
