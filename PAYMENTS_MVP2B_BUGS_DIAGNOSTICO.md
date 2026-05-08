# PAYMENTS MVP.2B — DIAGNÓSTICO DE BUGS CRÍTICOS
**Fecha:** 2026-05-08 20:15 UTC  
**Reporter:** Jhonatan  
**Diagnosticador:** Kepler

---

## 🚨 BUGS DETECTADOS

### BUG 1: "Transacción no encontrada" en `/payment/bank-transfer/[transactionId]`
**Severidad:** CRÍTICA  
**Impacto:** Usuario NO puede ver instrucciones de pago ni subir comprobante

### BUG 2: `/account/orders/[id]` NO muestra detalles de transferencia bancaria
**Severidad:** CRÍTICA  
**Impacto:** Usuario pierde acceso a datos bancarios después de salir de la página inicial

### BUG 3: Inconsistencia visual "Esperando pago" vs "Pago confirmado"
**Severidad:** MEDIA  
**Impacto:** Confusión del usuario sobre estado real del pedido

---

## DIAGNÓSTICO BUG 1 — "Transacción no encontrada"

### Síntomas
- URL correcta: `https://bagclue.vercel.app/payment/bank-transfer/2220fab8-125c-4d75-bc0e-06a94012a28b`
- Página muestra: "Transacción no encontrada"
- Usuario es GUEST (sin auth, sin session)

### Root Causes Identificadas

**RC1.1 — Página NO pasa `customer_email` al API**

**Archivo:** `src/app/payment/bank-transfer/[transactionId]/page.tsx`  
**Líneas:** 44-57

**Código actual:**
```typescript
const { data: { session } } = await supabaseCustomer.auth.getSession()
const headers: HeadersInit = {}

if (session?.access_token) {
  headers['Authorization'] = `Bearer ${session.access_token}`
}

const res = await fetch(`/api/payments/bank-transfer/config?transaction_id=${transactionId}`, {
  headers  // ❌ Solo incluye Authorization si existe
})
```

**Problema:**
- Si usuario es GUEST (sin session), NO se pasa `customer_email` como query param
- Backend `/api/payments/bank-transfer/config` REQUIERE ownership validation
- Sin `customer_email` ni Authorization → 403 Forbidden

**Backend esperado:**
- Query param: `?transaction_id=XXX&customer_email=qa-mvp2b@bagclue.com`
- OR Authorization header con token válido

**Página actual envía:**
- Query param: `?transaction_id=XXX` (sin customer_email para guest)
- Headers: `{}` (vacío si guest)

**Resultado:** API rechaza con 403 → Página muestra "Transacción no encontrada"

---

**RC1.2 — Query directa a Supabase falla por RLS**

**Archivo:** `src/app/payment/bank-transfer/[transactionId]/page.tsx`  
**Líneas:** 62-68

**Código actual:**
```typescript
const { data: transaction } = await supabaseCustomer
  .from('payment_transactions')
  .select('id, order_id, payment_reference, amount, expires_at')
  .eq('id', transactionId)
  .single()
```

**Problema:**
- Query usa `supabaseCustomer` (anon key, sin auth para guest)
- Tabla `payment_transactions` tiene RLS estricto
- Error devuelto: `"permission denied for table users"`

**Resultado:** Query falla incluso si API /config pasara

---

**RC1.3 — /cart NO pasa customer_email en redirect**

**Archivo:** `src/app/cart/page.tsx`  
**Línea:** 125

**Código actual:**
```typescript
router.push(`/payment/bank-transfer/${data.transactionId}`)
```

**Problema:**
- Redirect NO pasa `customer_email` via query params ni localStorage
- Página destino NO tiene forma de identificar guest user
- Guest checkout pierde acceso inmediatamente después de crear orden

**Soluciones posibles:**
1. Pasar email via query: `?email=xxx` (inseguro, visible en URL)
2. Guardar en localStorage: `localStorage.setItem('pendingBankTransferEmail', email)`
3. Usar `tracking_token` de order en vez de `transaction_id`
4. Generar token temporal de acceso para guest checkout

---

### Orden QA Validada

**Order ID:** `64e93146-9d80-4f3f-84f7-aecbae9ff2e2`  
**Transaction ID:** `2220fab8-125c-4d75-bc0e-06a94012a28b`  
**Customer Email:** `qa-mvp2b@bagclue.com`  
**User ID:** `null` (guest checkout)  
**Payment Reference:** `BGCL-1778269801649-OUAG`

**Status Actual:**
- Order: `pending`
- Transaction: `proof_uploaded` (comprobante subido en QA)
- Payment Status: `pending`
- Product: `reserved`

---

## DIAGNÓSTICO BUG 2 — `/account/orders/[id]` sin transferencia

### Síntomas
- Página `/account/orders/[id]` muestra "Esperando pago" genérico
- NO muestra método de pago usado
- NO muestra datos bancarios
- NO muestra referencia de pago
- NO muestra estado del comprobante
- NO ofrece botón para subir comprobante o ver instrucciones

### Root Causes Identificadas

**RC2.1 — Backend NO establece `payment_method` field**

**Archivo:** `src/app/api/payments/bank-transfer/order/route.ts`  
**Líneas:** 115-127

**Código actual:**
```typescript
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    subtotal: product.price,
    shipping: 0,
    total: product.price,
    payment_status: 'pending',
    status: 'pending',
    tracking_token: trackingToken,
    // ❌ payment_method NO establecido
  })
```

**Problema:**
- Campo `payment_method` queda `NULL`
- Frontend NO puede identificar que la orden fue por transferencia bancaria
- NO puede mostrar UI específica para bank transfer

**Valores esperados para payment_method:**
- `'stripe'` → Pago con tarjeta
- `'bank_transfer_mxn'` → Transferencia bancaria MXN
- `'layaway'` → Apartado (futuro)

**Estado actual orden QA:**
```json
{
  "id": "64e93146-9d80-4f3f-84f7-aecbae9ff2e2",
  "payment_method": null,  // ❌ Debería ser 'bank_transfer_mxn'
  "payment_status": "pending",
  "status": "pending"
}
```

---

**RC2.2 — Frontend NO tiene lógica para transferencia bancaria**

**Archivo:** `src/app/account/orders/[id]/page.tsx`  
**Líneas:** 342-358 (sección "Estado del pago")

**Código actual:**
```typescript
<div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
  <h3 className="text-lg font-medium text-gray-900 mb-4">Estado del pago</h3>
  
  <div className="flex items-center gap-3">
    <span className={`text-sm px-3 py-1.5 rounded border ${
      order.payment_status === 'paid' 
        ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }`}>
      {order.payment_status === 'paid' ? '✓ Pagado' : '⏳ Pendiente'}
    </span>
  </div>
</div>
```

**Problema:**
- Solo muestra badge genérico "Pendiente" o "Pagado"
- NO detecta `payment_method === 'bank_transfer_mxn'`
- NO renderiza bloque de instrucciones/estado de transferencia

**Falta:**
1. Detección de `payment_method === 'bank_transfer_mxn'`
2. Bloque UI con:
   - Banco, titular, CLABE (parcial), referencia
   - Estado del comprobante
   - Botón "Subir comprobante" o "Ver instrucciones"
   - Link a `/payment/bank-transfer/[transactionId]`
3. Estados posibles:
   - `proof_pending` → Mostrar botón subir comprobante
   - `proof_uploaded` → Mostrar "Comprobante recibido, validando..."
   - `rejected` → Mostrar "Comprobante rechazado, subir nuevo"
   - `confirmed` → Mostrar "Pago confirmado"

---

**RC2.3 — Frontend NO puede obtener transaction_id para link**

**Problema:**
- Página carga solo `order` data (sin joins a `payment_transactions`)
- NO tiene `transaction_id` disponible
- NO puede construir link a `/payment/bank-transfer/[transactionId]`

**Query actual (línea 176):**
```typescript
.from('orders')
.select(`
  *,
  order_items(...)
`)
// ❌ NO incluye payment_transactions
```

**Query necesaria:**
```typescript
.from('orders')
.select(`
  *,
  order_items(...),
  payment_transactions(id, payment_reference, status, proof_url, proof_uploaded_at, expires_at)
`)
```

---

## DIAGNÓSTICO BUG 3 — Inconsistencia visual timeline

### Síntomas
- Arriba: "Esperando pago" (correcto)
- Timeline: Muestra "Pago confirmado" (incorrecto)

### Root Cause Probable

**Archivo:** `src/components/OrderTimeline.tsx` (probable)

**Problema probable:**
- Timeline muestra estados hardcodeados o mal configurados
- NO sincronizado con `order.payment_status`
- Muestra "Pago confirmado" aunque payment_status = 'pending'

**Nota:** No puedo confirmar sin revisar el componente OrderTimeline, pero el diagnóstico inicial sugiere:
1. Timeline tiene lógica de estados defectuosa
2. O recibe props incorrectos desde la página padre

---

## 📋 RESUMEN EJECUTIVO

### BUG 1: "Transacción no encontrada"
**Root causes:**
1. Página NO pasa `customer_email` al API para guest users
2. Query directa Supabase falla por RLS
3. /cart NO pasa email en redirect

**Impacto:** Guest checkout NO funciona (0% usuarios guest pueden ver instrucciones)

### BUG 2: Panel cliente sin transferencia
**Root causes:**
1. Backend NO establece `payment_method` field
2. Frontend NO tiene lógica para detectar/mostrar transferencia
3. Frontend NO carga transaction data para construir link

**Impacto:** Usuario pierde acceso a instrucciones bancarias después de salir de página inicial

### BUG 3: Timeline inconsistente
**Root cause:** Timeline muestra estados incorrectos (probablemente lógica defectuosa)

**Impacto:** Confusión del usuario sobre estado real

---

## 🔧 PROPUESTAS DE FIX (PENDIENTE APROBACIÓN)

### FIX 1.1 — Pasar customer_email desde /cart

**Opción A: Query params (simple pero inseguro)**
```typescript
// src/app/cart/page.tsx:125
router.push(`/payment/bank-transfer/${data.transactionId}?email=${encodeURIComponent(customerEmail)}`)
```

**Pros:** Simple, funciona inmediatamente  
**Contras:** Email visible en URL (leak de privacidad), no persiste en reload

**Opción B: localStorage (más seguro)**
```typescript
// src/app/cart/page.tsx:125
localStorage.setItem('pendingBankTransferEmail', customerEmail)
router.push(`/payment/bank-transfer/${data.transactionId}`)

// src/app/payment/bank-transfer/[transactionId]/page.tsx:54
const emailFromStorage = localStorage.getItem('pendingBankTransferEmail')
const url = emailFromStorage 
  ? `/api/payments/bank-transfer/config?transaction_id=${transactionId}&customer_email=${encodeURIComponent(emailFromStorage)}`
  : `/api/payments/bank-transfer/config?transaction_id=${transactionId}`
```

**Pros:** Email no visible en URL, persiste en reload  
**Contras:** Requiere cleanup después de uso

**Opción C: Usar order tracking_token (más robusto)**
```typescript
// Cambiar URL a: /payment/bank-transfer/order/[tracking_token]
// Backend valida ownership via tracking_token + customer_email lookup
```

**Pros:** Token público diseñado para tracking, más seguro  
**Contras:** Requiere más cambios (nueva ruta, nueva API)

**Recomendación:** Opción B (localStorage) para MVP.2B fix rápido

---

### FIX 1.2 — Eliminar query directa Supabase

**Cambio:**
```typescript
// ❌ ELIMINAR query directa (líneas 62-68)
const { data: transaction } = await supabaseCustomer
  .from('payment_transactions')
  .select('...')

// ✅ USAR solo API response
const configData = await res.json()
// Backend devuelve transaction data completo
```

**Backend ajuste:** API `/config` debe devolver transaction completa, no solo bankConfig

---

### FIX 2.1 — Backend establece payment_method

**Archivo:** `src/app/api/payments/bank-transfer/order/route.ts:120`

**Cambio:**
```typescript
.insert({
  customer_name: customerName,
  customer_email: customerEmail,
  customer_phone: customerPhone,
  subtotal: product.price,
  shipping: 0,
  total: product.price,
  payment_status: 'pending',
  status: 'pending',
  payment_method: 'bank_transfer_mxn',  // ✅ Agregar
  tracking_token: trackingToken,
})
```

---

### FIX 2.2 — Frontend detecta y muestra transferencia

**Archivo:** `src/app/account/orders/[id]/page.tsx`

**Cambios:**
1. Query incluye payment_transactions (línea 176)
2. Lógica condicional en "Estado del pago" (línea 342-358)
3. Bloque UI nuevo para bank_transfer_mxn

**Pseudocódigo:**
```typescript
if (order.payment_method === 'bank_transfer_mxn' && order.payment_status === 'pending') {
  // Obtener transaction
  const transaction = order.payment_transactions[0]
  
  // Mostrar bloque:
  // - Banco, CLABE parcial, referencia
  // - Estado: "Esperando comprobante" o "Validando comprobante"
  // - Botón: "Ver instrucciones de pago" → /payment/bank-transfer/[transactionId]
  // - Si proof_uploaded: badge "Comprobante recibido"
}
```

---

### FIX 3 — Timeline sincronizado con payment_status

**Pendiente:** Revisar `src/components/OrderTimeline.tsx` y corregir lógica de estados

---

## ⚠️ RESTRICCIONES CONFIRMADAS

NO tocar:
- DB schema
- RLS policies
- Stripe live keys
- Stripe webhook
- Checkout Stripe actual
- Admin verification backend
- Emails
- Layaways
- Inventario
- Admin envíos

---

**Fin del diagnóstico**  
**Esperando aprobación de fix mínimo de Jhonatan**
