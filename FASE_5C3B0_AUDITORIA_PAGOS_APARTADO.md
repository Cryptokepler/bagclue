# FASE 5C.3B.0 — AUDITORÍA Y DISEÑO DE PAGOS DE APARTADO

**Fecha:** 2026-05-02  
**Fase:** 5C.3B.0 (Auditoría y diseño)  
**Estado:** 🔍 AUDITORÍA COMPLETA - NO IMPLEMENTADO

---

## ⚠️ CONFIRMACIONES OBLIGATORIAS

- ✅ **NO se implementó nada**
- ✅ **NO se tocó código**
- ✅ **NO se tocó Stripe**
- ✅ **NO se tocó webhook**
- ✅ **NO se tocó checkout**
- ✅ **NO se tocó admin**
- ✅ **NO se tocó DB/RLS/migrations**
- ✅ **Solo auditoría y propuesta**

---

## 📋 ÍNDICE

1. [Auditoría del Checkout Actual](#1-auditoría-del-checkout-actual)
2. [Auditoría del Webhook Actual](#2-auditoría-del-webhook-actual)
3. [Auditoría de Tablas Involucradas](#3-auditoría-de-tablas-involucradas)
4. [Flujo Propuesto: Pagar Siguiente Cuota](#4-flujo-propuesto-pagar-siguiente-cuota)
5. [Flujo Propuesto: Pagar Saldo Completo](#5-flujo-propuesto-pagar-saldo-completo)
6. [Metadata Stripe Propuesta](#6-metadata-stripe-propuesta)
7. [Endpoints Propuestos](#7-endpoints-propuestos)
8. [Cambios Propuestos al Webhook](#8-cambios-propuestos-al-webhook)
9. [Cambios Propuestos a Success Page](#9-cambios-propuestos-a-success-page)
10. [Reglas de Seguridad](#10-reglas-de-seguridad)
11. [Reglas de Idempotencia](#11-reglas-de-idempotencia)
12. [Estados que se Actualizan](#12-estados-que-se-actualizan)
13. [Qué Pasa al Completar 100%](#13-qué-pasa-al-completar-100)
14. [Riesgos y Mitigaciones](#14-riesgos-y-mitigaciones)
15. [Plan de Implementación](#15-plan-de-implementación)

---

## 1. AUDITORÍA DEL CHECKOUT ACTUAL

### 1.1. Archivo: `/api/checkout/create-session/route.ts`

**Flujo actual de compra de contado:**

1. **Entrada:** `POST /api/checkout/create-session`
   - Body: `{ items[], customer_email, customer_name, customer_phone, shipping_address }`
   - Auth header (opcional): Bearer token para usuarios logueados

2. **Validación productos:**
   - SELECT product WHERE id = item.product_id
   - Validar: `is_published = true`
   - Validar: `status = 'available'`
   - Validar: `stock > 0`
   - Validar: `price EXISTS`

3. **Reserva inmediata:**
   ```sql
   UPDATE products SET status = 'reserved' WHERE id = product_id
   ```

4. **Crear orden (status=pending, payment_status=pending):**
   ```sql
   INSERT INTO orders (
     customer_name, customer_email, customer_phone, 
     shipping_address, user_id, subtotal, shipping, total,
     status='pending', payment_status='pending'
   )
   ```

5. **Crear order_items:**
   ```sql
   INSERT INTO order_items (
     order_id, product_id, quantity, unit_price, subtotal, product_snapshot
   )
   ```

6. **Crear Stripe Checkout Session:**
   ```javascript
   stripe.checkout.sessions.create({
     payment_method_types: ['card'],
     line_items: [...],
     mode: 'payment',
     success_url: '/checkout/success?session_id={CHECKOUT_SESSION_ID}',
     cancel_url: '/checkout/cancel',
     customer_email,
     metadata: {
       order_id: order.id
     },
     expires_at: now + 30 minutos
   })
   ```

7. **Guardar session_id:**
   ```sql
   UPDATE orders SET stripe_session_id = session.id WHERE id = order.id
   ```

8. **Retornar:** `{ url: session.url }`

---

### 1.2. Metadata actual para órdenes de contado

```javascript
metadata: {
  order_id: "uuid"
}
```

**Problema identificado:** No hay campo `type` para distinguir orden vs layaway payment.

---

### 1.3. Rollback en caso de error

Si falla creación de orden o Stripe session:
```sql
UPDATE products SET status = 'available' WHERE id IN (productos_reservados)
```

---

## 2. AUDITORÍA DEL WEBHOOK ACTUAL

### 2.1. Archivo: `/api/stripe/webhook/route.ts`

**Eventos soportados:**
- `checkout.session.completed`
- `checkout.session.expired`

**Flujo para `checkout.session.completed`:**

1. **Leer metadata.type:**
   - Si `type === 'layaway_deposit'` → `handleLayawayDeposit()`
   - Si `type === 'layaway_balance'` → `handleLayawayBalance()`
   - Si no tiene type → **asumir orden de contado**

2. **Para orden de contado:**
   ```javascript
   const order_id = session.metadata.order_id
   
   // Buscar orden
   SELECT id, status, payment_status FROM orders WHERE id = order_id
   
   // Actualizar orden
   UPDATE orders SET 
     payment_status = 'paid',
     status = 'confirmed',
     stripe_payment_intent_id = session.payment_intent
   WHERE id = order_id
   
   // Obtener items
   SELECT product_id FROM order_items WHERE order_id = order_id
   
   // Marcar productos como sold
   FOR EACH product_id:
     IF stock === 1:
       UPDATE products SET status = 'sold', stock = 0
     ELSE:
       UPDATE products SET stock = stock - 1
   ```

3. **Para layaway_deposit (sistema antiguo):**
   ```javascript
   const layaway_id = session.metadata.layaway_id
   
   // Actualizar layaway
   UPDATE layaways SET
     status = 'active',
     deposit_payment_intent_id = session.payment_intent,
     deposit_paid_at = NOW()
   WHERE id = layaway_id
   
   // Reservar producto
   UPDATE products SET status = 'reserved' WHERE id = layaway.product_id
   ```

4. **Para layaway_balance (sistema antiguo):**
   ```javascript
   const layaway_id = session.metadata.layaway_id
   
   // Completar layaway
   UPDATE layaways SET
     status = 'completed',
     balance_payment_intent_id = session.payment_intent,
     balance_paid_at = NOW(),
     completed_at = NOW()
   WHERE id = layaway_id
   
   // Crear orden final
   INSERT INTO orders (
     customer_name, customer_email, customer_phone,
     total, subtotal, shipping=0,
     status='confirmed', payment_status='paid',
     stripe_session_id, stripe_payment_intent_id,
     layaway_id
   )
   
   // Crear order_item
   INSERT INTO order_items (order_id, product_id, quantity=1, unit_price)
   
   // Link order back to layaway
   UPDATE layaways SET order_id = order.id
   
   // Marcar producto como sold
   UPDATE products SET status = 'sold', stock = 0
   ```

**Flujo para `checkout.session.expired`:**

1. **Cancelar orden:**
   ```sql
   UPDATE orders SET status='cancelled', payment_status='failed'
   ```

2. **Liberar productos:**
   ```sql
   UPDATE products SET status='available'
   ```

---

### 2.2. Idempotencia actual

**NO hay idempotencia explícita** en el webhook actual.

Si Stripe manda evento duplicado:
- Se ejecuta el UPDATE/INSERT de nuevo
- Puede causar inconsistencias

**Riesgo alto:** Eventos duplicados pueden corromper datos.

---

### 2.3. Logging actual

Webhook actual tiene logging extenso:
- LOG 1-11 para debugging
- Logs de constructEvent SUCCESS/FAILED
- Logs de cada UPDATE con resultado

**Bueno para debugging**, pero falta idempotencia.

---

## 3. AUDITORÍA DE TABLAS INVOLUCRADAS

### 3.1. Tabla `layaways`

**Columnas relevantes para pagos de cuotas:**

```sql
-- Plan configuration
plan_type TEXT CHECK (plan_type IN ('cash', '4_weekly_payments', '8_weekly_payments', '18_weekly_payments'))
total_payments INTEGER
first_payment_amount NUMERIC(10, 2)
minimum_first_payment_amount NUMERIC(10, 2)

-- Amounts
total_amount NUMERIC(10, 2)
amount_paid NUMERIC(10, 2) DEFAULT 0
amount_remaining NUMERIC(10, 2)

-- Payment tracking
payments_completed INTEGER DEFAULT 0
payments_remaining INTEGER
next_payment_due_date TIMESTAMPTZ
next_payment_amount NUMERIC(10, 2)

-- Plan dates
plan_start_date TIMESTAMPTZ DEFAULT NOW()
plan_end_date TIMESTAMPTZ
last_payment_at TIMESTAMPTZ

-- Control
consecutive_weeks_without_payment INTEGER DEFAULT 0
forfeited_at TIMESTAMPTZ

-- Customer account link
user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL

-- Policy versioning
policy_version INTEGER DEFAULT 2

-- Status
status TEXT CHECK (status IN (
  'pending', 'active', 'completed', 'expired', 'cancelled',
  'pending_first_payment', 'overdue', 'forfeited',
  'cancelled_for_non_payment', 'cancelled_manual', 'forfeiture_pending'
))

-- Stripe old system (deprecated)
deposit_payment_intent_id TEXT
balance_payment_intent_id TEXT
deposit_paid_at TIMESTAMPTZ
balance_paid_at TIMESTAMPTZ

-- Relation
order_id UUID REFERENCES orders(id)
```

**Campos calculados requeridos:**
- `amount_paid` = SUM(layaway_payments WHERE status='paid')
- `amount_remaining` = total_amount - amount_paid
- `payments_completed` = COUNT(layaway_payments WHERE status='paid')
- `payments_remaining` = total_payments - payments_completed
- `next_payment_due_date` = MIN(layaway_payments.due_date WHERE status='pending')
- `next_payment_amount` = layaway_payments.amount_due WHERE due_date = next_payment_due_date

---

### 3.2. Tabla `layaway_payments`

```sql
CREATE TABLE layaway_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relation
  layaway_id UUID NOT NULL REFERENCES layaways(id) ON DELETE CASCADE,
  
  -- Payment identification
  payment_number INTEGER NOT NULL,
  
  -- Amounts
  amount_due NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2),
  
  -- Dates
  due_date TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'pending', 'paid', 'overdue', 'cancelled', 'forfeited', 'failed'
  )) DEFAULT 'pending',
  
  -- Stripe integration
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  
  -- Payment type
  payment_type TEXT CHECK (payment_type IN (
    'first', 'installment', 'final', 'extra'
  )),
  
  -- Admin notes
  admin_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE (layaway_id, payment_number)
);
```

**Índices:**
- `idx_layaway_payments_layaway_id` (layaway_id)
- `idx_layaway_payments_status` (status)
- `idx_layaway_payments_due_date` (due_date)
- `idx_layaway_payments_payment_number` (payment_number)
- `idx_layaway_payments_unique` (layaway_id, payment_number) UNIQUE

---

### 3.3. Tabla `orders`

```sql
-- Campos relevantes
id UUID PRIMARY KEY
customer_name TEXT
customer_email TEXT
customer_phone TEXT
user_id UUID REFERENCES auth.users(id)
subtotal NUMERIC(10, 2)
shipping NUMERIC(10, 2)
total NUMERIC(10, 2)
status TEXT
payment_status TEXT
stripe_session_id TEXT
stripe_payment_intent_id TEXT
layaway_id UUID REFERENCES layaways(id)
tracking_token TEXT UNIQUE
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**Relación con layaway:**
- `layaway_id` se rellena cuando se crea orden final al completar 100%
- Orden se crea SOLO cuando layaway está completed

---

### 3.4. Tabla `order_items`

```sql
id UUID PRIMARY KEY
order_id UUID REFERENCES orders(id)
product_id UUID REFERENCES products(id)
quantity INTEGER
unit_price NUMERIC(10, 2)
subtotal NUMERIC(10, 2)
product_snapshot JSONB
```

---

### 3.5. Tabla `products`

```sql
id UUID PRIMARY KEY
title TEXT
brand TEXT
price NUMERIC(10, 2)
status TEXT CHECK (status IN ('available', 'reserved', 'sold', 'draft'))
stock INTEGER DEFAULT 1
is_published BOOLEAN DEFAULT true
```

**Estados relevantes:**
- `available` → producto en catálogo
- `reserved` → apartado activo (no se puede comprar)
- `sold` → vendido (apartado completado o compra directa)

---

### 3.6. RLS Policies

**layaway_payments:**
- Service role: full access
- Authenticated: SELECT own layaway payments

**layaways:**
- Service role: full access
- Authenticated: SELECT own layaways (user_id = auth.uid() OR customer_email IN customer_profiles)
- NO public access directo

**orders:**
- Service role: full access
- (No se documentó RLS específico en migración 020)

---

## 4. FLUJO PROPUESTO: PAGAR SIGUIENTE CUOTA

### 4.1. Endpoint

**POST** `/api/layaways/[id]/pay-installment`

---

### 4.2. Request

```json
{
  "payment_number": 3  // Opcional - si no se envía, usar next pending
}
```

**Headers:**
```
Authorization: Bearer <supabase_jwt_token>
```

---

### 4.3. Validaciones (Backend)

1. **Autenticación:**
   ```javascript
   const authHeader = request.headers.get('authorization')
   if (!authHeader) {
     return 401 Unauthorized
   }
   
   const token = authHeader.replace('Bearer ', '')
   const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
   
   if (error || !user) {
     return 401 Unauthorized
   }
   ```

2. **Ownership del layaway:**
   ```sql
   SELECT * FROM layaways
   WHERE id = layaway_id
     AND (
       user_id = authenticated_user_id
       OR customer_email IN (
         SELECT email FROM customer_profiles WHERE user_id = authenticated_user_id
       )
     )
   ```
   
   Si no existe o no pertenece al usuario:
   ```
   return 403 Forbidden
   ```

3. **Estado del layaway:**
   ```javascript
   if (layaway.status !== 'active') {
     return 400 Bad Request - "Cannot pay installment. Layaway status is: ${status}"
   }
   ```

4. **Encontrar próxima cuota pendiente:**
   ```sql
   SELECT * FROM layaway_payments
   WHERE layaway_id = layaway_id
     AND status = 'pending'
   ORDER BY payment_number ASC
   LIMIT 1
   ```
   
   Si no existe:
   ```
   return 400 Bad Request - "No pending payments found"
   ```

5. **Validar que no esté ya pagada:**
   ```javascript
   if (payment.status === 'paid') {
     return 400 Bad Request - "Payment already completed"
   }
   ```

6. **Validar cuota específica (si se envió payment_number):**
   ```javascript
   if (request.payment_number && payment.payment_number !== request.payment_number) {
     return 400 Bad Request - "Payment #${request.payment_number} is not the next pending payment"
   }
   ```

---

### 4.4. Crear Stripe Checkout Session

```javascript
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  payment_method_types: ['card'],
  line_items: [
    {
      price_data: {
        currency: layaway.currency?.toLowerCase() || 'mxn',
        product_data: {
          name: `Cuota #${payment.payment_number}: ${product.brand} ${product.title}`,
          description: `Pago ${payment.payment_number}/${layaway.total_payments} del plan de apartado`,
          images: []
        },
        unit_amount: Math.round(payment.amount_due * 100) // Stripe usa centavos
      },
      quantity: 1
    }
  ],
  customer_email: layaway.customer_email,
  metadata: {
    type: 'layaway_installment',         // NUEVO tipo
    layaway_id: layaway.id,
    layaway_payment_id: payment.id,
    payment_number: payment.payment_number,
    payment_type: payment.payment_type,
    user_id: user.id,
    customer_email: layaway.customer_email
  },
  success_url: `${baseUrl}/account/layaways/${layaway.id}?payment_success=true`,
  cancel_url: `${baseUrl}/account/layaways/${layaway.id}?payment_cancelled=true`,
  expires_at: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutos
})
```

---

### 4.5. Guardar session_id en payment

```sql
UPDATE layaway_payments
SET stripe_session_id = session.id
WHERE id = payment.id
```

---

### 4.6. Response

```json
{
  "checkout_url": "https://checkout.stripe.com/...",
  "payment_id": "uuid",
  "payment_number": 3,
  "amount_due": 21000.00,
  "due_date": "2026-05-13T00:00:00Z"
}
```

---

## 5. FLUJO PROPUESTO: PAGAR SALDO COMPLETO

### 5.1. Endpoint

**POST** `/api/layaways/[id]/pay-full`

---

### 5.2. Request

```json
{}  // Body vacío - no requiere parámetros
```

**Headers:**
```
Authorization: Bearer <supabase_jwt_token>
```

---

### 5.3. Validaciones (Backend)

1-3. **Autenticación + Ownership + Estado del layaway:** Igual que pagar cuota

4. **Calcular saldo pendiente:**
   ```sql
   SELECT 
     total_amount,
     amount_paid,
     amount_remaining
   FROM layaways
   WHERE id = layaway_id
   ```
   
   ```javascript
   const balance = layaway.amount_remaining
   
   if (balance <= 0) {
     return 400 Bad Request - "Layaway already fully paid"
   }
   ```

5. **Estrategia de pago completo:** ¿Crear un payment extra o distribuir?

   **Opción recomendada: Crear un solo payment tipo `extra`**
   
   ```sql
   INSERT INTO layaway_payments (
     layaway_id,
     payment_number = (SELECT MAX(payment_number) + 1 FROM layaway_payments WHERE layaway_id = ?),
     amount_due = balance,
     amount_paid = NULL,
     due_date = NOW(),
     status = 'pending',
     payment_type = 'extra',
     stripe_session_id = NULL
   )
   RETURNING *
   ```
   
   **Ventajas:**
   - Historial claro: pago extra de saldo completo
   - No modifica cuotas existentes
   - Más fácil de rastrear
   
   **Alternativa (NO recomendada):** Marcar todas las cuotas pendientes como cancelled y crear una sola `extra`
   
   **Por qué NO:** Complica historial y reconciliación

---

### 5.4. Crear Stripe Checkout Session

```javascript
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  payment_method_types: ['card'],
  line_items: [
    {
      price_data: {
        currency: layaway.currency?.toLowerCase() || 'mxn',
        product_data: {
          name: `Saldo completo: ${product.brand} ${product.title}`,
          description: `Pago final del apartado (${layaway.payments_completed}/${layaway.total_payments} cuotas pagadas)`,
          images: []
        },
        unit_amount: Math.round(balance * 100) // Stripe usa centavos
      },
      quantity: 1
    }
  ],
  customer_email: layaway.customer_email,
  metadata: {
    type: 'layaway_full_balance',        // NUEVO tipo
    layaway_id: layaway.id,
    layaway_payment_id: fullPayment.id,
    payment_number: fullPayment.payment_number,
    payment_type: 'extra',
    user_id: user.id,
    customer_email: layaway.customer_email,
    balance_amount: balance
  },
  success_url: `${baseUrl}/account/layaways/${layaway.id}?payment_success=true&full_balance=true`,
  cancel_url: `${baseUrl}/account/layaways/${layaway.id}?payment_cancelled=true`,
  expires_at: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutos
})
```

---

### 5.5. Response

```json
{
  "checkout_url": "https://checkout.stripe.com/...",
  "payment_id": "uuid",
  "payment_number": 9,
  "payment_type": "extra",
  "amount_due": 126000.00,
  "message": "Pago final del apartado"
}
```

---

## 6. METADATA STRIPE PROPUESTA

### 6.1. Para pago de cuota

```javascript
metadata: {
  type: 'layaway_installment',
  layaway_id: 'uuid',
  layaway_payment_id: 'uuid',
  payment_number: 3,
  payment_type: 'installment',
  user_id: 'uuid',
  customer_email: 'email@example.com'
}
```

---

### 6.2. Para pago de saldo completo

```javascript
metadata: {
  type: 'layaway_full_balance',
  layaway_id: 'uuid',
  layaway_payment_id: 'uuid',
  payment_number: 9,
  payment_type: 'extra',
  user_id: 'uuid',
  customer_email: 'email@example.com',
  balance_amount: 126000.00
}
```

---

### 6.3. Para orden de contado (agregar type)

**PROPUESTA:** Agregar `type: 'order'` a metadata de órdenes de contado

```javascript
metadata: {
  type: 'order',                  // NUEVO
  order_id: 'uuid',
  customer_email: 'email@example.com'  // NUEVO
}
```

---

### 6.4. Comparación con sistema antiguo (deprecated)

**Sistema antiguo:**
```javascript
// Depósito
metadata: {
  type: 'layaway_deposit',
  layaway_id: 'uuid',
  product_id: 'uuid'
}

// Saldo
metadata: {
  type: 'layaway_balance',
  layaway_id: 'uuid',
  product_id: 'uuid'
}
```

**Sistema nuevo (policy_version=2):**
```javascript
// Cuota
metadata: {
  type: 'layaway_installment',
  layaway_id: 'uuid',
  layaway_payment_id: 'uuid',   // NUEVO - más específico
  payment_number: 3,              // NUEVO - para debugging
  payment_type: 'installment',    // NUEVO
  user_id: 'uuid',                // NUEVO - para validación
  customer_email: 'email'         // NUEVO - para reconciliación
}
```

---

## 7. ENDPOINTS PROPUESTOS

### 7.1. Pagar siguiente cuota

**Endpoint:** `POST /api/layaways/[id]/pay-installment`

**Auth:** Required (Bearer token)

**Request body:**
```json
{
  "payment_number": 3  // Opcional
}
```

**Response 200:**
```json
{
  "checkout_url": "https://checkout.stripe.com/...",
  "payment_id": "uuid",
  "payment_number": 3,
  "amount_due": 21000.00,
  "due_date": "2026-05-13T00:00:00Z"
}
```

**Errors:**
- 401: No autenticado
- 403: No es dueño del layaway
- 400: Layaway no está activo
- 400: No hay cuotas pendientes
- 400: Cuota ya pagada
- 500: Error interno

---

### 7.2. Pagar saldo completo

**Endpoint:** `POST /api/layaways/[id]/pay-full`

**Auth:** Required (Bearer token)

**Request body:**
```json
{}  // Vacío
```

**Response 200:**
```json
{
  "checkout_url": "https://checkout.stripe.com/...",
  "payment_id": "uuid",
  "payment_number": 9,
  "payment_type": "extra",
  "amount_due": 126000.00,
  "message": "Pago final del apartado"
}
```

**Errors:**
- 401: No autenticado
- 403: No es dueño del layaway
- 400: Layaway no está activo
- 400: Saldo ya pagado completamente
- 500: Error interno

---

### 7.3. Verificar sesión de pago de layaway (OPCIONAL)

**Endpoint:** `GET /api/layaways/verify-session?session_id=xxx`

**Auth:** Optional (para tracking público)

**Response 200:**
```json
{
  "success": true,
  "message": "Payment verified",
  "layaway_id": "uuid",
  "payment_id": "uuid",
  "payment_number": 3,
  "payment_status": "paid",
  "layaway_status": "active",
  "amount_paid_total": 63000.00,
  "amount_remaining": 126000.00
}
```

**Uso:**
- Success page puede verificar pago
- Alternativa: confiar 100% en webhook

**Recomendación:** NO implementar en fase inicial. Confiar en webhook + UI polling si es necesario.

---

## 8. CAMBIOS PROPUESTOS AL WEBHOOK

### 8.1. Estructura nueva del webhook handler

```javascript
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata_type = session.metadata?.type
  
  // ===== NUEVO: Dispatcher basado en type =====
  switch (metadata_type) {
    case 'order':
      await handleOrderPayment(session)
      break
    
    case 'layaway_installment':
      await handleLayawayInstallment(session)
      break
    
    case 'layaway_full_balance':
      await handleLayawayFullBalance(session)
      break
    
    // ===== Sistema antiguo (mantener compatibilidad) =====
    case 'layaway_deposit':
      await handleLayawayDeposit(session)
      break
    
    case 'layaway_balance':
      await handleLayawayBalance(session)
      break
    
    // ===== Fallback para órdenes antiguas sin type =====
    default:
      if (session.metadata?.order_id) {
        await handleOrderPayment(session)
      } else {
        console.error('[WEBHOOK] ERROR: Unknown metadata type or missing order_id')
      }
      break
  }
}
```

---

### 8.2. Handler: `handleLayawayInstallment()`

```javascript
async function handleLayawayInstallment(session: Stripe.Checkout.Session) {
  const layaway_id = session.metadata?.layaway_id
  const layaway_payment_id = session.metadata?.layaway_payment_id
  const payment_number = session.metadata?.payment_number
  
  // === 1. VALIDACIONES ===
  if (!layaway_id || !layaway_payment_id) {
    console.error('[WEBHOOK] ERROR: Missing layaway metadata')
    return
  }
  
  console.log(`[WEBHOOK] Processing installment payment #${payment_number} for layaway: ${layaway_id}`)
  
  // === 2. IDEMPOTENCIA: Verificar si payment ya está paid ===
  const { data: existingPayment } = await supabaseAdmin
    .from('layaway_payments')
    .select('id, status, paid_at')
    .eq('id', layaway_payment_id)
    .single()
  
  if (existingPayment?.status === 'paid') {
    console.log(`[WEBHOOK] ✓ Payment ${layaway_payment_id} already marked as paid (idempotent)`)
    return  // Early return - idempotencia
  }
  
  // === 3. ACTUALIZAR layaway_payment ===
  const { error: paymentError } = await supabaseAdmin
    .from('layaway_payments')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: session.payment_intent as string || null,
      amount_paid: session.amount_total / 100  // Stripe usa centavos
    })
    .eq('id', layaway_payment_id)
  
  if (paymentError) {
    console.error('[WEBHOOK] ERROR updating layaway_payment:', paymentError)
    return
  }
  
  // === 4. RECALCULAR montos del layaway ===
  const { data: allPayments } = await supabaseAdmin
    .from('layaway_payments')
    .select('amount_paid, status')
    .eq('layaway_id', layaway_id)
  
  const totalPaid = allPayments
    ?.filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0
  
  const paidCount = allPayments?.filter(p => p.status === 'paid').length || 0
  
  // === 5. ENCONTRAR next_payment_due_date ===
  const { data: nextPayment } = await supabaseAdmin
    .from('layaway_payments')
    .select('due_date, amount_due')
    .eq('layaway_id', layaway_id)
    .eq('status', 'pending')
    .order('payment_number', { ascending: true })
    .limit(1)
    .single()
  
  // === 6. OBTENER layaway para calcular remaining ===
  const { data: layaway } = await supabaseAdmin
    .from('layaways')
    .select('total_amount, total_payments')
    .eq('id', layaway_id)
    .single()
  
  const amountRemaining = (layaway?.total_amount || 0) - totalPaid
  const paymentsRemaining = (layaway?.total_payments || 0) - paidCount
  
  // === 7. DETERMINAR status ===
  let newStatus = 'active'
  
  if (amountRemaining <= 0 || paymentsRemaining <= 0) {
    newStatus = 'completed'
  }
  
  // === 8. ACTUALIZAR layaway ===
  const { error: layawayError } = await supabaseAdmin
    .from('layaways')
    .update({
      amount_paid: totalPaid,
      amount_remaining: Math.max(amountRemaining, 0),
      payments_completed: paidCount,
      payments_remaining: Math.max(paymentsRemaining, 0),
      next_payment_due_date: nextPayment?.due_date || null,
      next_payment_amount: nextPayment?.amount_due || null,
      last_payment_at: new Date().toISOString(),
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined
    })
    .eq('id', layaway_id)
  
  if (layawayError) {
    console.error('[WEBHOOK] ERROR updating layaway:', layawayError)
    return
  }
  
  // === 9. SI COMPLETED: Crear orden final ===
  if (newStatus === 'completed') {
    await createOrderFromLayaway(layaway_id, session)
  }
  
  console.log(`[WEBHOOK] ✓ Installment payment #${payment_number} confirmed, layaway status: ${newStatus}`)
}
```

---

### 8.3. Handler: `handleLayawayFullBalance()`

```javascript
async function handleLayawayFullBalance(session: Stripe.Checkout.Session) {
  const layaway_id = session.metadata?.layaway_id
  const layaway_payment_id = session.metadata?.layaway_payment_id
  const balance_amount = parseFloat(session.metadata?.balance_amount || '0')
  
  // === 1. VALIDACIONES ===
  if (!layaway_id || !layaway_payment_id) {
    console.error('[WEBHOOK] ERROR: Missing layaway metadata')
    return
  }
  
  console.log(`[WEBHOOK] Processing full balance payment for layaway: ${layaway_id}`)
  
  // === 2. IDEMPOTENCIA ===
  const { data: existingPayment } = await supabaseAdmin
    .from('layaway_payments')
    .select('id, status, paid_at')
    .eq('id', layaway_payment_id)
    .single()
  
  if (existingPayment?.status === 'paid') {
    console.log(`[WEBHOOK] ✓ Balance payment ${layaway_payment_id} already marked as paid (idempotent)`)
    return
  }
  
  // === 3. ACTUALIZAR payment extra ===
  const { error: paymentError } = await supabaseAdmin
    .from('layaway_payments')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: session.payment_intent as string || null,
      amount_paid: session.amount_total / 100
    })
    .eq('id', layaway_payment_id)
  
  if (paymentError) {
    console.error('[WEBHOOK] ERROR updating balance payment:', paymentError)
    return
  }
  
  // === 4. RECALCULAR montos ===
  const { data: allPayments } = await supabaseAdmin
    .from('layaway_payments')
    .select('amount_paid, status')
    .eq('layaway_id', layaway_id)
  
  const totalPaid = allPayments
    ?.filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0
  
  const paidCount = allPayments?.filter(p => p.status === 'paid').length || 0
  
  // === 5. OBTENER layaway ===
  const { data: layaway } = await supabaseAdmin
    .from('layaways')
    .select('total_amount, total_payments')
    .eq('id', layaway_id)
    .single()
  
  const amountRemaining = (layaway?.total_amount || 0) - totalPaid
  
  // === 6. ACTUALIZAR layaway a completed ===
  const { error: layawayError } = await supabaseAdmin
    .from('layaways')
    .update({
      amount_paid: totalPaid,
      amount_remaining: Math.max(amountRemaining, 0),
      payments_completed: paidCount,
      payments_remaining: 0,
      next_payment_due_date: null,
      next_payment_amount: null,
      last_payment_at: new Date().toISOString(),
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', layaway_id)
  
  if (layawayError) {
    console.error('[WEBHOOK] ERROR updating layaway to completed:', layawayError)
    return
  }
  
  // === 7. CREAR orden final ===
  await createOrderFromLayaway(layaway_id, session)
  
  console.log(`[WEBHOOK] ✓ Full balance payment confirmed, layaway completed`)
}
```

---

### 8.4. Helper: `createOrderFromLayaway()`

```javascript
async function createOrderFromLayaway(layaway_id: string, session: Stripe.Checkout.Session) {
  console.log(`[WEBHOOK] Creating final order for layaway: ${layaway_id}`)
  
  // === 1. OBTENER layaway ===
  const { data: layaway, error: fetchError } = await supabaseAdmin
    .from('layaways')
    .select('*')
    .eq('id', layaway_id)
    .single()
  
  if (fetchError || !layaway) {
    console.error('[WEBHOOK] ERROR fetching layaway:', fetchError)
    return
  }
  
  // === 2. VERIFICAR si ya existe orden ===
  if (layaway.order_id) {
    console.log(`[WEBHOOK] ✓ Order already exists for layaway: ${layaway.order_id} (idempotent)`)
    return  // Idempotencia
  }
  
  // === 3. CREAR orden ===
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      customer_name: layaway.customer_name,
      customer_email: layaway.customer_email,
      customer_phone: layaway.customer_phone,
      user_id: layaway.user_id,
      total: layaway.total_amount,
      subtotal: layaway.total_amount,
      shipping: 0,
      status: 'confirmed',
      payment_status: 'paid',
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string || null,
      layaway_id: layaway.id
    })
    .select()
    .single()
  
  if (orderError || !order) {
    console.error('[WEBHOOK] ERROR creating order:', orderError)
    return
  }
  
  console.log(`[WEBHOOK] ✓ Order created: ${order.id}`)
  
  // === 4. CREAR order_item ===
  const { error: itemError } = await supabaseAdmin
    .from('order_items')
    .insert({
      order_id: order.id,
      product_id: layaway.product_id,
      quantity: 1,
      unit_price: layaway.total_amount,
      subtotal: layaway.total_amount
    })
  
  if (itemError) {
    console.error('[WEBHOOK] ERROR creating order_item:', itemError)
  }
  
  // === 5. LINK order back to layaway ===
  await supabaseAdmin
    .from('layaways')
    .update({ order_id: order.id })
    .eq('id', layaway_id)
  
  // === 6. ACTUALIZAR producto: reserved → sold ===
  const { error: productError } = await supabaseAdmin
    .from('products')
    .update({ status: 'sold', stock: 0 })
    .eq('id', layaway.product_id)
  
  if (productError) {
    console.error('[WEBHOOK] ERROR updating product to sold:', productError)
  }
  
  console.log(`[WEBHOOK] ✓ Layaway ${layaway_id} completed, order ${order.id} created, product marked as sold`)
}
```

---

### 8.5. Actualizar `handleOrderPayment()` (órdenes de contado)

**Agregar logging de metadata.type:**

```javascript
async function handleOrderPayment(session: Stripe.Checkout.Session) {
  const order_id = session.metadata?.order_id
  
  console.log('[WEBHOOK] Processing order payment:', {
    order_id,
    type: session.metadata?.type || 'legacy_order'
  })
  
  // ... resto del código actual sin cambios
}
```

---

## 9. CAMBIOS PROPUESTOS A SUCCESS PAGE

### 9.1. Opción 1: Reutilizar `/checkout/success` (NO RECOMENDADA)

**Problema:**
- Lógica actual asume siempre orden de contado
- Mezcla concerns (orden vs layaway)
- Complejidad de mantener

**Por qué NO:**
- Código ya complejo con verify-session, tracking URL, cart clearing
- Layaway tiene flujo diferente (no hay tracking inmediato)
- Riesgo de bugs en producción

---

### 9.2. Opción 2: Crear `/account/layaways/success` ✅ RECOMENDADA

**Nueva página:** `/account/layaways/success`

**Query params:**
- `session_id` (opcional - para verificación)
- `layaway_id` (requerido)
- `payment_number` (opcional - para mostrar cuota específica)
- `full_balance` (opcional - true si fue pago completo)

**Flujo:**

1. **Leer params:**
   ```javascript
   const layaway_id = searchParams.get('layaway_id')
   const payment_number = searchParams.get('payment_number')
   const full_balance = searchParams.get('full_balance') === 'true'
   ```

2. **Verificar autenticación:**
   ```javascript
   const { data: { user } } = await supabaseCustomer.auth.getUser()
   if (!user) {
     redirect('/account/login')
   }
   ```

3. **Cargar layaway:**
   ```javascript
   const { data: layaway } = await supabaseCustomer
     .from('layaways')
     .select(`
       *,
       product:products(title, brand),
       payments:layaway_payments(*)
     `)
     .eq('id', layaway_id)
     .single()
   ```

4. **Mostrar UI:**
   - ✅ "¡Pago exitoso!"
   - Cuota pagada: #X de Y
   - Monto pagado: $X
   - Saldo restante: $Y
   - Estado del apartado: Activo / Completado
   - Botones:
     - "Ver mi apartado" → `/account/layaways/${layaway_id}`
     - "Ver todos mis apartados" → `/account/layaways`
     - Si completed: "Ver mi pedido" → `/account/orders/${order_id}`

---

### 9.3. Opción 3: Crear `/layaway/success` (genérica)

Similar a Opción 2, pero sin autenticación requerida (tracking público).

**NO recomendada:** Layaway debe ser privado (panel de cliente).

---

### 9.4. Actualizar success_url en Stripe sessions

**Para pagar cuota:**
```javascript
success_url: `${baseUrl}/account/layaways/${layaway.id}?payment_success=true&payment_number=${payment.payment_number}`
```

**Para pagar saldo:**
```javascript
success_url: `${baseUrl}/account/layaways/${layaway.id}?payment_success=true&full_balance=true`
```

**Alternativa con página dedicada:**
```javascript
success_url: `${baseUrl}/account/layaways/success?layaway_id=${layaway.id}&payment_number=${payment.payment_number}`
```

---

### 9.5. Decisión final

**RECOMENDACIÓN:**

1. **NO crear página separada `/account/layaways/success`** en fase inicial
2. **Usar success_url → `/account/layaways/[id]?payment_success=true`**
3. **Agregar banner de confirmación** en `/account/layaways/[id]/page.tsx`

**Ventajas:**
- Menos código
- Usuario regresa directo a su apartado
- Puede ver estado actualizado inmediatamente
- Banner temporal con mensaje "✅ Pago confirmado - actualizando estado..."

**Implementación del banner:**
```typescript
const payment_success = searchParams.get('payment_success')
const payment_number = searchParams.get('payment_number')
const full_balance = searchParams.get('full_balance')

{payment_success && (
  <div className="bg-green-50 border border-green-200 p-4 mb-6">
    <p className="text-green-800 font-medium">
      ✅ ¡Pago confirmado!
    </p>
    <p className="text-sm text-green-700">
      {full_balance 
        ? 'Saldo pagado completamente. Tu apartado ha sido completado.'
        : `Cuota #${payment_number} pagada exitosamente.`
      }
    </p>
    <p className="text-xs text-green-600 mt-2">
      El estado se actualizará en unos segundos...
    </p>
  </div>
)}
```

---

## 10. REGLAS DE SEGURIDAD

### 10.1. Autenticación obligatoria

**Todos los endpoints de pago requieren autenticación:**

```javascript
const authHeader = request.headers.get('authorization')
if (!authHeader) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const token = authHeader.replace('Bearer ', '')
const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**NO confiar en:**
- user_id del body
- email del body
- layaway_id sin validación de ownership

---

### 10.2. Validación de ownership

**SIEMPRE validar que el layaway pertenece al usuario:**

```javascript
const { data: layaway } = await supabaseAdmin
  .from('layaways')
  .select('*')
  .eq('id', layaway_id)
  .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
  .single()

if (!layaway) {
  return NextResponse.json({ 
    error: 'Forbidden - Layaway not found or access denied' 
  }, { status: 403 })
}
```

**Alternativa con customer_profiles:**
```javascript
const { data: profiles } = await supabaseAdmin
  .from('customer_profiles')
  .select('email')
  .eq('user_id', user.id)

const allowedEmails = profiles?.map(p => p.email) || []

const { data: layaway } = await supabaseAdmin
  .from('layaways')
  .select('*')
  .eq('id', layaway_id)
  .or(`user_id.eq.${user.id},customer_email.in.(${allowedEmails.join(',')})`)
  .single()
```

---

### 10.3. Usar service_role solo en backend

**RLS policies:**
- `layaway_payments`: Customers can SELECT own payments
- `layaways`: Customers can SELECT own layaways

**Backend APIs:**
- Usar `supabaseAdmin` (service_role) para escribir datos
- RLS se bypasea automáticamente
- Validación de ownership en código

**Frontend:**
- Usar `supabaseCustomer` (anon key + auth)
- RLS aplica automáticamente
- Solo puede SELECT own data

---

### 10.4. No exponer apartados ajenos

**Prohibido:**
```javascript
// ❌ MAL - cualquier usuario puede leer cualquier layaway
const { data } = await supabaseCustomer
  .from('layaways')
  .select('*')
  .eq('id', layaway_id)
  .single()
```

**Correcto:**
```javascript
// ✅ BIEN - RLS filtra automáticamente por user_id
const { data } = await supabaseCustomer
  .from('layaways')
  .select('*')
  .eq('id', layaway_id)
  .single()  // Solo retorna si user_id = auth.uid() o email match
```

**Backend con service_role:**
```javascript
// ✅ BIEN - validación explícita de ownership
const { data: user } = await supabaseAdmin.auth.getUser(token)
const { data } = await supabaseAdmin
  .from('layaways')
  .select('*')
  .eq('id', layaway_id)
  .eq('user_id', user.id)  // Validación explícita
  .single()
```

---

### 10.5. No permitir pagar apartado de otra persona

**Validar en `/api/layaways/[id]/pay-installment`:**

1. Token JWT → user_id
2. Layaway ownership → user_id o email match
3. Si no match → 403 Forbidden

**Nunca confiar en:**
- layaway_id del URL sin validación
- user_id del body
- customer_email del body

---

### 10.6. No permitir pagar producto sold/cancelled/completed

**Validar status antes de crear Stripe session:**

```javascript
if (layaway.status !== 'active') {
  return NextResponse.json({ 
    error: `Cannot pay. Layaway status is: ${layaway.status}` 
  }, { status: 400 })
}
```

**Status válidos para pagar cuota:**
- `active` ✅

**Status inválidos:**
- `pending` ❌ (aún no confirmado)
- `completed` ❌ (ya pagado)
- `cancelled` ❌
- `forfeited` ❌
- `expired` ❌
- `overdue` ⚠️ (permitir pago, pero mostrar warning)

---

### 10.7. Validar montos

**Stripe session amount debe coincidir con layaway_payment.amount_due:**

```javascript
const expectedAmount = payment.amount_due * 100  // Centavos
const sessionAmount = Math.round(payment.amount_due * 100)

if (sessionAmount !== expectedAmount) {
  console.error('[PAY] Amount mismatch:', { sessionAmount, expectedAmount })
  return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
}
```

**En webhook:**
```javascript
const paidAmount = session.amount_total / 100  // De centavos a MXN
const expectedAmount = payment.amount_due

// Tolerancia de 1 centavo por redondeo
if (Math.abs(paidAmount - expectedAmount) > 0.01) {
  console.error('[WEBHOOK] Amount mismatch:', { paidAmount, expectedAmount })
  // NO retornar - solo loggear para investigación manual
}
```

---

## 11. REGLAS DE IDEMPOTENCIA

### 11.1. Problema: Webhooks duplicados

**Stripe puede enviar el mismo evento múltiples veces:**
- Retry automático si respuesta 5xx
- Retry automático si timeout
- Retry manual desde Dashboard

**Sin idempotencia:**
- Payment se marca como paid múltiples veces
- amount_paid se suma múltiples veces
- Orden se crea múltiples veces

---

### 11.2. Estrategia: Check-then-set

**En webhook, ANTES de UPDATE:**

```javascript
// 1. Verificar estado actual
const { data: existingPayment } = await supabaseAdmin
  .from('layaway_payments')
  .select('id, status, paid_at, stripe_payment_intent_id')
  .eq('id', layaway_payment_id)
  .single()

// 2. Early return si ya está paid
if (existingPayment?.status === 'paid') {
  console.log(`[WEBHOOK] ✓ Payment ${layaway_payment_id} already paid (idempotent)`)
  return  // No hacer nada
}

// 3. Proceder con UPDATE solo si no estaba paid
const { error } = await supabaseAdmin
  .from('layaway_payments')
  .update({
    status: 'paid',
    paid_at: new Date().toISOString(),
    stripe_payment_intent_id: session.payment_intent
  })
  .eq('id', layaway_payment_id)
```

---

### 11.3. Idempotencia en creación de orden

**Verificar si orden ya existe:**

```javascript
const { data: layaway } = await supabaseAdmin
  .from('layaways')
  .select('order_id')
  .eq('id', layaway_id)
  .single()

if (layaway.order_id) {
  console.log(`[WEBHOOK] ✓ Order already exists: ${layaway.order_id} (idempotent)`)
  return  // No crear orden duplicada
}

// Proceder con INSERT order solo si no existe
```

---

### 11.4. Idempotencia con stripe_payment_intent_id

**Alternativa: Usar payment_intent como clave única:**

```javascript
// Verificar si ya existe payment con este payment_intent
const { data: existingPayment } = await supabaseAdmin
  .from('layaway_payments')
  .select('id, status')
  .eq('stripe_payment_intent_id', session.payment_intent)
  .eq('layaway_id', layaway_id)
  .single()

if (existingPayment) {
  console.log(`[WEBHOOK] ✓ Payment already processed with intent: ${session.payment_intent}`)
  return
}
```

**Ventaja:** Más robusto  
**Desventaja:** Requiere índice en stripe_payment_intent_id

---

### 11.5. Logging para debugging de idempotencia

```javascript
console.log('[WEBHOOK] Idempotency check:', {
  layaway_payment_id,
  current_status: existingPayment?.status,
  paid_at: existingPayment?.paid_at,
  stripe_payment_intent_id: existingPayment?.stripe_payment_intent_id,
  new_payment_intent_id: session.payment_intent,
  action: existingPayment?.status === 'paid' ? 'SKIP (idempotent)' : 'PROCEED'
})
```

---

## 12. ESTADOS QUE SE ACTUALIZAN

### 12.1. Después de pagar cuota (installment)

**layaway_payment:**
```javascript
{
  status: 'paid',                              // pending → paid
  paid_at: '2026-05-02T11:30:00Z',            // NULL → now
  stripe_payment_intent_id: 'pi_xxx',         // NULL → intent_id
  amount_paid: 21000.00                        // NULL → session.amount_total / 100
}
```

**layaway:**
```javascript
{
  amount_paid: 63000.00,                       // Recalculado (SUM paid payments)
  amount_remaining: 126000.00,                 // total_amount - amount_paid
  payments_completed: 3,                       // COUNT paid payments
  payments_remaining: 5,                       // total_payments - payments_completed
  next_payment_due_date: '2026-05-13T00:00:00Z',  // MIN due_date WHERE status=pending
  next_payment_amount: 21000.00,               // amount_due of next payment
  last_payment_at: '2026-05-02T11:30:00Z',    // now
  status: 'active',                            // Mantiene active (no completed aún)
  consecutive_weeks_without_payment: 0         // Reset a 0
}
```

**products:** NO cambia (sigue `reserved`)

---

### 12.2. Después de pagar saldo completo (full_balance)

**layaway_payment (nuevo payment extra):**
```javascript
{
  id: 'uuid-nuevo',
  layaway_id: 'uuid',
  payment_number: 9,                           // MAX(payment_number) + 1
  amount_due: 126000.00,                       // Saldo completo
  amount_paid: 126000.00,                      // Confirmado
  due_date: '2026-05-02T11:30:00Z',           // NOW (pago inmediato)
  paid_at: '2026-05-02T11:30:00Z',            // NOW
  status: 'paid',
  stripe_session_id: 'cs_xxx',
  stripe_payment_intent_id: 'pi_xxx',
  payment_type: 'extra'
}
```

**layaway:**
```javascript
{
  amount_paid: 189000.00,                      // total_amount (100%)
  amount_remaining: 0.00,                      // 0
  payments_completed: 3,                       // Cuotas + extra = 4 total
  payments_remaining: 0,                       // 0
  next_payment_due_date: NULL,                 // No hay siguiente
  next_payment_amount: NULL,                   // No hay siguiente
  last_payment_at: '2026-05-02T11:30:00Z',    // NOW
  status: 'completed',                         // active → completed ✅
  completed_at: '2026-05-02T11:30:00Z',       // NOW
  order_id: 'uuid-orden-nueva'                 // Link a orden final
}
```

**orders (nueva):**
```javascript
{
  id: 'uuid-nuevo',
  customer_name: 'Jhonatan Venegas',
  customer_email: 'jhonatanvenegas@usdtcapital.es',
  customer_phone: '+34722385452',
  user_id: 'uuid-jhonatan',
  subtotal: 189000.00,
  shipping: 0,
  total: 189000.00,
  status: 'confirmed',                         // Confirmado desde creación
  payment_status: 'paid',                      // Pagado desde creación
  stripe_session_id: 'cs_xxx',
  stripe_payment_intent_id: 'pi_xxx',
  layaway_id: 'uuid-layaway',                  // Link back
  tracking_token: 'auto-generated',
  created_at: '2026-05-02T11:30:00Z'
}
```

**order_items (nuevo):**
```javascript
{
  id: 'uuid-nuevo',
  order_id: 'uuid-orden',
  product_id: 'uuid-producto',
  quantity: 1,
  unit_price: 189000.00,
  subtotal: 189000.00,
  product_snapshot: null                        // Opcional (puede omitirse)
}
```

**products:**
```javascript
{
  status: 'sold',                               // reserved → sold ✅
  stock: 0                                      // 1 → 0
}
```

---

### 12.3. Si pago falla (expired/cancelled)

**layaway_payment:**
```javascript
{
  status: 'failed',                             // pending → failed
  stripe_session_id: 'cs_xxx'                   // Se guarda para referencia
}
```

**layaway:** NO cambia (sigue active)

**Estrategia:** Permitir reintentar pago de la misma cuota.

---

## 13. QUÉ PASA AL COMPLETAR 100%

### 13.1. Trigger: amount_paid >= total_amount

```javascript
if (amountRemaining <= 0 || paymentsRemaining <= 0) {
  newStatus = 'completed'
}
```

---

### 13.2. Secuencia de acciones (en webhook)

1. **Marcar layaway como completed:**
   ```sql
   UPDATE layaways SET
     status = 'completed',
     completed_at = NOW(),
     amount_remaining = 0,
     payments_remaining = 0,
     next_payment_due_date = NULL,
     next_payment_amount = NULL
   WHERE id = layaway_id
   ```

2. **Crear orden final:**
   ```sql
   INSERT INTO orders (
     customer_name,
     customer_email,
     customer_phone,
     user_id,
     total,
     subtotal,
     shipping = 0,
     status = 'confirmed',
     payment_status = 'paid',
     stripe_session_id,
     stripe_payment_intent_id,
     layaway_id
   ) RETURNING *
   ```

3. **Crear order_item:**
   ```sql
   INSERT INTO order_items (
     order_id,
     product_id,
     quantity = 1,
     unit_price = total_amount,
     subtotal = total_amount
   )
   ```

4. **Link orden back to layaway:**
   ```sql
   UPDATE layaways SET order_id = order.id WHERE id = layaway_id
   ```

5. **Marcar producto como sold:**
   ```sql
   UPDATE products SET
     status = 'sold',
     stock = 0
   WHERE id = product_id
   ```

6. **Generar tracking_token (automático):**
   - Trigger en orders ya genera tracking_token
   - No requiere acción adicional

---

### 13.3. Estado final

**layaway:**
- `status = 'completed'`
- `order_id` apunta a orden final
- `amount_remaining = 0`
- Visible en `/account/layaways` con badge "Completado"

**order:**
- `status = 'confirmed'`
- `payment_status = 'paid'`
- `layaway_id` apunta back a layaway
- Visible en `/account/orders`
- Tiene `tracking_token` para tracking público

**product:**
- `status = 'sold'`
- `stock = 0`
- Ya no aparece en catálogo

---

### 13.4. Experiencia del cliente

1. **En `/account/layaways`:**
   - Apartado aparece con badge "✅ Completado"
   - Card muestra: Pagado $189,000 / Saldo $0
   - Botón "Ver pedido" en lugar de "Pagar cuota"

2. **En `/account/layaways/[id]`:**
   - Estado: Completado
   - Calendario: 8/8 cuotas pagadas (o 2/8 + pago extra de saldo)
   - Sección nueva: "🎉 Apartado completado"
   - Link a orden final: "Ver mi pedido →"

3. **En `/account/orders`:**
   - Nueva orden aparece
   - Status: Confirmada
   - Pagado: ✅
   - Tracking disponible

4. **Tracking público:**
   - `/track/[tracking_token]` funciona
   - Muestra origen: "Apartado #xxx"

---

## 14. RIESGOS Y MITIGACIONES

### 14.1. Riesgo: Webhook duplicado

**Escenario:**
- Stripe envía evento 2 veces
- Payment se marca como paid 2 veces
- amount_paid se suma doble

**Mitigación:**
```javascript
// Check-then-set idempotencia
if (existingPayment?.status === 'paid') {
  return  // Early return
}
```

**Nivel de riesgo:** 🔴 ALTO  
**Prioridad:** 🔥 CRÍTICA  
**Estado:** ✅ Mitigado en propuesta

---

### 14.2. Riesgo: Pago con email distinto

**Escenario:**
- Layaway creado con `email_a@example.com`
- Usuario cambia email en Stripe checkout a `email_b@example.com`
- Payment confirmado pero no reconcilia

**Mitigación:**
```javascript
// NO confiar en session.customer_email
// Usar metadata.customer_email como source of truth
const expectedEmail = session.metadata.customer_email
const paidEmail = session.customer_email

if (expectedEmail !== paidEmail) {
  console.warn('[WEBHOOK] Email mismatch:', { expectedEmail, paidEmail })
  // PROCEDER igual - solo warning
}
```

**Nivel de riesgo:** 🟡 MEDIO  
**Prioridad:** ⚠️ MEDIA  
**Estado:** ✅ Mitigado con warning log

---

### 14.3. Riesgo: Monto incorrecto

**Escenario:**
- Frontend manda amount_due = $21,000
- Stripe session creada con amount = $21,000
- Entre creación y pago, alguien modifica layaway_payment.amount_due en DB
- Webhook reconcilia con amount incorrecto

**Mitigación:**
```javascript
// Validar monto en webhook
const paidAmount = session.amount_total / 100
const expectedAmount = payment.amount_due

if (Math.abs(paidAmount - expectedAmount) > 0.01) {
  console.error('[WEBHOOK] Amount mismatch:', { 
    paidAmount, 
    expectedAmount,
    diff: paidAmount - expectedAmount
  })
  // NO retornar - loggear para revisión manual
  // Marcar payment como paid igual (Stripe ya cobró)
}
```

**Nivel de riesgo:** 🟢 BAJO  
**Prioridad:** ℹ️ BAJA  
**Estado:** ✅ Mitigado con logging

---

### 14.4. Riesgo: Pago de cuota ya pagada

**Escenario:**
- Usuario paga cuota #3
- Webhook aún no procesó
- Usuario refresca y paga cuota #3 de nuevo (mismo payment_id)

**Mitigación 1 (Frontend):**
```javascript
// Deshabilitar botón después de click
const [paying, setPaying] = useState(false)

async function handlePay() {
  setPaying(true)
  const response = await fetch('/api/layaways/.../pay-installment')
  // NO resetear paying - dejar disabled permanentemente
}
```

**Mitigación 2 (Backend):**
```javascript
// Validar status antes de crear session
if (payment.status === 'paid') {
  return 400 Bad Request - "Payment already completed"
}

// Validar si ya tiene stripe_session_id activo
if (payment.stripe_session_id) {
  // Verificar si sesión sigue activa
  const session = await stripe.checkout.sessions.retrieve(payment.stripe_session_id)
  if (session.status === 'open') {
    return 400 Bad Request - "Payment session already active"
  }
}
```

**Nivel de riesgo:** 🟡 MEDIO  
**Prioridad:** ⚠️ MEDIA  
**Estado:** ✅ Mitigado con validaciones

---

### 14.5. Riesgo: Pago de apartado de otra persona

**Escenario:**
- Usuario A intenta pagar layaway de Usuario B
- URL: `/api/layaways/uuid-b/pay-installment`

**Mitigación:**
```javascript
// Validar ownership SIEMPRE
const { data: layaway } = await supabaseAdmin
  .from('layaways')
  .select('*')
  .eq('id', layaway_id)
  .eq('user_id', authenticated_user.id)
  .single()

if (!layaway) {
  return 403 Forbidden
}
```

**Nivel de riesgo:** 🔴 ALTO  
**Prioridad:** 🔥 CRÍTICA  
**Estado:** ✅ Mitigado en propuesta

---

### 14.6. Riesgo: Layaway vencido

**Escenario:**
- Layaway expiró (status=expired)
- Usuario intenta pagar cuota

**Mitigación:**
```javascript
if (layaway.status !== 'active') {
  return 400 Bad Request - "Cannot pay. Layaway status is: ${status}"
}
```

**Alternativa para overdue:**
```javascript
if (layaway.status === 'overdue') {
  // Permitir pago pero mostrar warning
  console.warn('[PAY] Paying overdue layaway')
}
```

**Nivel de riesgo:** 🟢 BAJO  
**Prioridad:** ℹ️ BAJA  
**Estado:** ✅ Mitigado con validación

---

### 14.7. Riesgo: Producto ya vendido

**Escenario:**
- Layaway activo
- Admin vendió producto manualmente (status=sold)
- Usuario intenta pagar cuota

**Mitigación:**
```javascript
// En webhook, antes de marcar producto como sold
const { data: product } = await supabaseAdmin
  .from('products')
  .select('status')
  .eq('id', product_id)
  .single()

if (product.status === 'sold') {
  console.error('[WEBHOOK] ERROR: Product already sold')
  // NO marcar layaway como completed
  // Escalar a admin para resolución manual
  return
}
```

**Nivel de riesgo:** 🟡 MEDIO  
**Prioridad:** ⚠️ MEDIA  
**Estado:** ✅ Mitigado con check previo

---

### 14.8. Riesgo: Fallo entre pago y actualización DB

**Escenario:**
- Stripe cobró exitosamente
- Webhook se ejecuta
- DB update falla (timeout, lock, etc.)
- Payment confirmado pero DB no actualizado

**Mitigación 1 (Retry automático de Stripe):**
- Stripe reintenta webhook automáticamente
- Hasta 3 días de retries

**Mitigación 2 (Idempotencia):**
- Webhook con check-then-set
- Segundo retry actualiza correctamente

**Mitigación 3 (Reconciliación manual):**
```sql
-- Query para encontrar payments desincronizados
SELECT lp.id, lp.stripe_session_id, lp.status
FROM layaway_payments lp
WHERE lp.stripe_session_id IS NOT NULL
  AND lp.status = 'pending'
  AND lp.created_at < NOW() - INTERVAL '1 hour'
```

**Nivel de riesgo:** 🟡 MEDIO  
**Prioridad:** ⚠️ MEDIA  
**Estado:** ✅ Mitigado con retry + idempotencia

---

### 14.9. Riesgo: Reconciliación manual

**Escenario:**
- Admin necesita marcar payment como paid manualmente
- Admin necesita completar layaway manualmente

**Mitigación:**
- Crear endpoints admin (fuera de scope de esta fase)
- `/api/admin/layaways/[id]/mark-payment-paid`
- `/api/admin/layaways/[id]/complete`

**Nivel de riesgo:** 🟢 BAJO  
**Prioridad:** ℹ️ BAJA  
**Estado:** ⚠️ Pendiente (Fase admin futura)

---

## 15. PLAN DE IMPLEMENTACIÓN

### FASE 5C.3B.1 — Backend: Pagar Siguiente Cuota (Sin UI)

**Objetivo:** Crear API para pagar siguiente cuota, testeada con Postman/curl

**Alcance:**
- ✅ Crear `/api/layaways/[id]/pay-installment/route.ts`
- ✅ Validaciones: auth, ownership, status, payment existe
- ✅ Crear Stripe Checkout Session con metadata correcta
- ✅ Guardar session_id en layaway_payment
- ✅ NO tocar UI todavía

**Criterios de cierre:**
- Request POST funciona con Bearer token
- Ownership validado correctamente
- Stripe session se crea con metadata correcta
- session_id se guarda en layaway_payment
- Test con payment test:
  ```bash
  curl -X POST \
    -H "Authorization: Bearer eyJ..." \
    https://bagclue.vercel.app/api/layaways/xxx/pay-installment
  ```

**Archivos:**
- `src/app/api/layaways/[id]/pay-installment/route.ts` (NUEVO)

**Duración estimada:** 2-3 horas

---

### FASE 5C.3B.2 — Webhook: Reconciliar Pago de Cuota

**Objetivo:** Webhook procesa `layaway_installment` y actualiza DB

**Alcance:**
- ✅ Agregar handler `handleLayawayInstallment()` en webhook
- ✅ Idempotencia con check-then-set
- ✅ Actualizar layaway_payment (status=paid, paid_at, payment_intent)
- ✅ Recalcular amount_paid, payments_completed, next_payment
- ✅ Actualizar layaway con montos recalculados
- ✅ NO completar layaway todavía (siguiente fase)

**Criterios de cierre:**
- Webhook recibe evento `checkout.session.completed`
- Metadata.type = `layaway_installment` se detecta
- layaway_payment se actualiza correctamente
- layaway amounts se recalculan correctamente
- Idempotencia funciona (evento duplicado no corrompe datos)
- Test con Stripe CLI:
  ```bash
  stripe trigger checkout.session.completed
  ```

**Archivos:**
- `src/app/api/stripe/webhook/route.ts` (MODIFICADO)

**Duración estimada:** 3-4 horas

---

### FASE 5C.3B.3 — UI: Botón "Pagar Siguiente Cuota"

**Objetivo:** Usuario puede pagar cuota desde panel de cliente

**Alcance:**
- ✅ Agregar botón en `/account/layaways/[id]` si hay cuota pendiente
- ✅ Modal de confirmación (opcional)
- ✅ Llamar API con Bearer token
- ✅ Redirect a Stripe checkout
- ✅ Success: regresar a `/account/layaways/[id]?payment_success=true`
- ✅ Agregar banner de confirmación en success

**Criterios de cierre:**
- Botón "Pagar siguiente cuota $21,000" visible
- Click → redirect a Stripe
- Pago exitoso → regresa a detalle con banner
- Estado actualizado después de webhook
- Banner muestra cuota pagada
- NO hay errores de consola

**Archivos:**
- `src/app/account/layaways/[id]/page.tsx` (MODIFICADO)

**Duración estimada:** 2-3 horas

---

### FASE 5C.3B.4 — Backend + UI: Pagar Saldo Completo

**Objetivo:** Usuario puede liquidar apartado en un solo pago

**Alcance:**
- ✅ Crear `/api/layaways/[id]/pay-full/route.ts`
- ✅ Crear payment extra tipo `extra`
- ✅ Stripe session con metadata `layaway_full_balance`
- ✅ Webhook: handler `handleLayawayFullBalance()`
- ✅ Actualizar layaway a `completed`
- ✅ UI: Botón "Pagar saldo completo $126,000"

**Criterios de cierre:**
- Backend: API crea payment extra correctamente
- Webhook: Procesa pago completo y marca completed
- UI: Botón visible en detalle de layaway
- Flow completo funciona end-to-end
- Test con layaway real

**Archivos:**
- `src/app/api/layaways/[id]/pay-full/route.ts` (NUEVO)
- `src/app/api/stripe/webhook/route.ts` (MODIFICADO)
- `src/app/account/layaways/[id]/page.tsx` (MODIFICADO)

**Duración estimada:** 4-5 horas

---

### FASE 5C.3B.5 — Completar Layaway y Crear Orden Final

**Objetivo:** Al pagar 100%, crear orden final automáticamente

**Alcance:**
- ✅ Helper `createOrderFromLayaway()` en webhook
- ✅ Crear order con status=confirmed, payment_status=paid
- ✅ Crear order_item
- ✅ Link layaway → order
- ✅ Marcar producto como sold
- ✅ Idempotencia: no crear orden duplicada

**Criterios de cierre:**
- Layaway completed → orden creada automáticamente
- Orden visible en `/account/orders`
- Producto marcado como sold
- Tracking token generado
- Idempotencia funciona (webhook duplicado no crea orden duplicada)

**Archivos:**
- `src/app/api/stripe/webhook/route.ts` (MODIFICADO)

**Duración estimada:** 3-4 horas

---

### FASE 5C.3B.6 — Validación End-to-End

**Objetivo:** Validar flow completo con layaway real de principio a fin

**Alcance:**
- ✅ Crear layaway test nuevo con plan 4 pagos
- ✅ Pagar cuota #1 (primera cuota)
- ✅ Pagar cuota #2
- ✅ Pagar cuota #3
- ✅ Pagar cuota #4 (debería completar)
- ✅ Validar orden final creada
- ✅ Validar producto sold
- ✅ Validar tracking disponible
- ✅ Limpiar data de test

**Criterios de cierre (12 validaciones):**
1. ✅ Cuota #1 pagada → layaway.amount_paid actualizado
2. ✅ Cuota #2 pagada → next_payment_due_date actualizado
3. ✅ Cuota #3 pagada → payments_completed incrementado
4. ✅ Cuota #4 pagada → layaway.status = completed
5. ✅ Orden final creada automáticamente
6. ✅ order_item existe
7. ✅ layaway.order_id apunta a orden
8. ✅ Producto status = sold
9. ✅ Producto stock = 0
10. ✅ Orden visible en `/account/orders`
11. ✅ Tracking público funciona
12. ✅ NO hay errores en consola

**Duración estimada:** 2-3 horas

---

### RESUMEN DE SUBFASES

| Fase | Descripción | Duración | Riesgo |
|------|-------------|----------|--------|
| 5C.3B.1 | Backend pagar cuota (sin UI) | 2-3h | 🟢 BAJO |
| 5C.3B.2 | Webhook reconciliar cuota | 3-4h | 🟡 MEDIO |
| 5C.3B.3 | UI botón pagar cuota | 2-3h | 🟢 BAJO |
| 5C.3B.4 | Backend + UI pagar saldo completo | 4-5h | 🟡 MEDIO |
| 5C.3B.5 | Completar layaway → crear orden | 3-4h | 🟡 MEDIO |
| 5C.3B.6 | Validación end-to-end | 2-3h | 🟢 BAJO |
| **TOTAL** | | **16-22h** | |

**Tiempo estimado total:** 2-3 días de desarrollo (full-time)

---

## 📊 ESTADO FINAL DE AUDITORÍA

### Auditoría completada: ✅

- ✅ 1. Auditoría del checkout actual
- ✅ 2. Auditoría del webhook actual
- ✅ 3. Auditoría de tablas involucradas
- ✅ 4. Flujo propuesto: pagar siguiente cuota
- ✅ 5. Flujo propuesto: pagar saldo completo
- ✅ 6. Metadata Stripe propuesta
- ✅ 7. Endpoints propuestos
- ✅ 8. Cambios propuestos al webhook
- ✅ 9. Cambios propuestos a success page
- ✅ 10. Reglas de seguridad
- ✅ 11. Reglas de idempotencia
- ✅ 12. Estados que se actualizan
- ✅ 13. Qué pasa al completar 100%
- ✅ 14. Riesgos y mitigaciones
- ✅ 15. Plan de implementación

---

## ⚠️ RECORDATORIO FINAL

**NO IMPLEMENTADO:**
- ❌ NO se creó ningún endpoint
- ❌ NO se modificó el webhook
- ❌ NO se tocó Stripe
- ❌ NO se tocó checkout
- ❌ NO se tocó admin
- ❌ NO se tocó DB/RLS/migrations
- ❌ NO se agregó UI

**SOLO AUDITORÍA Y DISEÑO** ✅

---

**FIN DE AUDITORÍA**

**Próximo paso:** Esperar aprobación formal antes de iniciar Fase 5C.3B.1
