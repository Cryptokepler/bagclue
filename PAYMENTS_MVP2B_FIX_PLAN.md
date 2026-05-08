# PAYMENTS MVP.2B — FIX PLAN
**Fecha:** 2026-05-08 20:25 UTC  
**Scope:** Fix mínimo para bugs críticos detectados

---

## 🎯 OBJETIVO

Corregir 3 bugs críticos:
1. ✅ "Transacción no encontrada" en `/payment/bank-transfer/[transactionId]`
2. ✅ `/account/orders/[id]` no muestra instrucciones de transferencia
3. ✅ Timeline inconsistente (muestra "Pago confirmado" cuando payment_status = pending)

---

## 🔧 CAMBIOS PROPUESTOS

### CAMBIO 1 — Backend: Establecer payment_method

**Archivo:** `src/app/api/payments/bank-transfer/order/route.ts`  
**Línea:** 120

**Cambio:**
```typescript
// ANTES:
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

// DESPUÉS:
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

**Motivo:** Frontend necesita identificar que la orden fue por transferencia bancaria

---

### CAMBIO 2 — /cart: Pasar customer_email via localStorage

**Archivo:** `src/app/cart/page.tsx`  
**Líneas:** 124-125

**Cambio:**
```typescript
// ANTES:
// Redirect to bank transfer instructions page
router.push(`/payment/bank-transfer/${data.transactionId}`)

// DESPUÉS:
// Save email for guest checkout ownership validation
localStorage.setItem('pendingBankTransferEmail', customerEmail)
localStorage.setItem('pendingBankTransferExpiry', String(Date.now() + 24 * 60 * 60 * 1000))
router.push(`/payment/bank-transfer/${data.transactionId}`)
```

**Motivo:** Página destino necesita customer_email para ownership validation (guest users)

---

### CAMBIO 3 — /payment/bank-transfer/[transactionId]: Leer email de localStorage

**Archivo:** `src/app/payment/bank-transfer/[transactionId]/page.tsx`  
**Líneas:** 41-57

**Cambio:**
```typescript
// ANTES:
async function fetchTransactionData() {
  try {
    const { data: { session } } = await supabaseCustomer.auth.getSession()
    const headers: HeadersInit = {}
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const res = await fetch(`/api/payments/bank-transfer/config?transaction_id=${transactionId}`, {
      headers
    })

// DESPUÉS:
async function fetchTransactionData() {
  try {
    const { data: { session } } = await supabaseCustomer.auth.getSession()
    const headers: HeadersInit = {}
    let customerEmail: string | null = null
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    } else {
      // Guest checkout: try to get email from localStorage
      const storedEmail = localStorage.getItem('pendingBankTransferEmail')
      const expiry = localStorage.getItem('pendingBankTransferExpiry')
      
      if (storedEmail && expiry && Number(expiry) > Date.now()) {
        customerEmail = storedEmail
      } else {
        // Clean expired storage
        localStorage.removeItem('pendingBankTransferEmail')
        localStorage.removeItem('pendingBankTransferExpiry')
      }
    }

    // Build URL with customer_email if guest
    const url = customerEmail
      ? `/api/payments/bank-transfer/config?transaction_id=${transactionId}&customer_email=${encodeURIComponent(customerEmail)}`
      : `/api/payments/bank-transfer/config?transaction_id=${transactionId}`

    const res = await fetch(url, { headers })
```

**Motivo:** Permitir guest users acceder a sus instrucciones de pago

---

### CAMBIO 4 — /payment/bank-transfer/[transactionId]: Eliminar query directa Supabase

**Archivo:** `src/app/payment/bank-transfer/[transactionId]/page.tsx`  
**Líneas:** 62-74

**Cambio:**
```typescript
// ❌ ELIMINAR query directa (falla por RLS para guest):
const { data: transaction } = await supabaseCustomer
  .from('payment_transactions')
  .select('id, order_id, payment_reference, amount, expires_at')
  .eq('id', transactionId)
  .single()

if (!transaction) {
  throw new Error('Transacción no encontrada')
}

// ✅ REEMPLAZAR: Obtener datos desde API response
```

**Nueva estructura de datos (líneas 75-82):**
```typescript
// API response ahora incluye transaction data completa
const configData = await res.json()

setData({
  transactionId: configData.transactionId,        // Desde API
  orderId: configData.orderId,                    // Desde API
  paymentReference: configData.paymentReference,  // Desde API
  amountMxn: configData.amountMxn,                // Desde API
  expiresAt: configData.expiresAt,                // Desde API
  bankConfig: configData.bankConfig
})
```

**Motivo:** Query directa falla por RLS. API backend ya tiene los datos.

---

### CAMBIO 5 — Backend API /config: Devolver transaction completa

**Archivo:** `src/app/api/payments/bank-transfer/config/route.ts`  
**Líneas:** 95-102

**Cambio:**
```typescript
// ANTES:
const response: BankConfigResponse = {
  bankConfig,
}

return NextResponse.json(response, { status: 200 })

// DESPUÉS:
// Fetch transaction data to include in response
const { data: transaction } = await supabase
  .from('payment_transactions')
  .select('id, order_id, payment_reference, amount, expires_at, status')
  .eq('id', transactionId)
  .single()

if (!transaction) {
  return NextResponse.json(
    { error: 'Transaction not found' },
    { status: 404 }
  )
}

const response = {
  transactionId: transaction.id,
  orderId: transaction.order_id,
  paymentReference: transaction.payment_reference,
  amountMxn: transaction.amount,
  expiresAt: transaction.expires_at,
  transactionStatus: transaction.status,
  bankConfig,
}

return NextResponse.json(response, { status: 200 })
```

**Motivo:** Frontend necesita transaction data para renderizar página, no puede hacer query directa por RLS

---

### CAMBIO 6 — /account/orders/[id]: Query incluir payment_transactions

**Archivo:** `src/app/account/orders/[id]/page.tsx`  
**Línea:** 176

**Cambio:**
```typescript
// ANTES:
.select(`
  *,
  order_items(
    id,
    quantity,
    unit_price,
    subtotal,
    product_id,
    product_snapshot
  )
`)

// DESPUÉS:
.select(`
  *,
  order_items(
    id,
    quantity,
    unit_price,
    subtotal,
    product_id,
    product_snapshot
  ),
  payment_transactions(
    id,
    payment_reference,
    status,
    proof_url,
    proof_uploaded_at,
    expires_at,
    rejection_reason
  )
`)
```

**Motivo:** Necesitamos transaction data para mostrar bloque de transferencia bancaria

---

### CAMBIO 7 — /account/orders/[id]: Agregar bloque de transferencia bancaria

**Archivo:** `src/app/account/orders/[id]/page.tsx`  
**Después de línea:** 358 (después de "Estado del pago")

**Código nuevo:**
```typescript
{/* Bank Transfer Payment Details - Only show if bank transfer and pending */}
{order.payment_method === 'bank_transfer_mxn' && order.payment_status === 'pending' && order.payment_transactions?.[0] && (
  <div className="bg-white border border-[#E85A9A]/20 rounded-lg p-6 mb-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">
      Pago por transferencia pendiente
    </h3>

    {(() => {
      const transaction = order.payment_transactions[0]
      const isExpired = new Date(transaction.expires_at) < new Date()
      const hasProof = transaction.status === 'proof_uploaded' || transaction.status === 'awaiting_approval'
      const isRejected = transaction.status === 'rejected'

      return (
        <>
          {/* Estado del comprobante */}
          {hasProof && (
            <div className="bg-blue-50 border border-blue-200 p-4 mb-4 rounded">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-800">Comprobante recibido</p>
                  <p className="text-sm text-blue-700 mt-1">Estamos validando tu pago. Te notificaremos cuando sea confirmado.</p>
                </div>
              </div>
            </div>
          )}

          {isRejected && (
            <div className="bg-red-50 border border-red-200 p-4 mb-4 rounded">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">Comprobante rechazado</p>
                  {transaction.rejection_reason && (
                    <p className="text-sm text-red-700 mt-1">{transaction.rejection_reason}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!hasProof && !isRejected && !isExpired && (
            <div className="bg-[#E85A9A]/5 border border-[#E85A9A]/20 p-4 mb-4 rounded">
              <p className="text-sm text-gray-700">
                Tu pieza queda reservada mientras validamos tu pago.
              </p>
            </div>
          )}

          {/* Datos bancarios */}
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Referencia de pago</p>
                <p className="font-mono text-sm font-medium text-gray-900">
                  {transaction.payment_reference}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Expira</p>
                <p className="text-sm text-gray-900">
                  {new Date(transaction.expires_at).toLocaleDateString('es-MX', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <Link
              href={`/payment/bank-transfer/${transaction.id}`}
              className="flex-1 bg-[#E85A9A] text-white text-center px-6 py-3 text-sm font-medium hover:bg-[#E85A9A]/90 transition-colors rounded"
            >
              Ver instrucciones de pago
            </Link>
          </div>
        </>
      )
    })()}
  </div>
)}
```

**Motivo:** Cliente necesita ver instrucciones bancarias y estado del comprobante desde panel de pedidos

---

### CAMBIO 8 — OrderTimeline: Recibir payment_status como prop

**Archivo:** `src/components/OrderTimeline.tsx`  
**Línea:** 13

**Cambio:**
```typescript
// ANTES:
interface OrderTimelineProps {
  order: {
    created_at: string
    shipping_status: string
    shipped_at?: string | null
    delivered_at?: string | null
    tracking_number?: string | null
  }
}

// DESPUÉS:
interface OrderTimelineProps {
  order: {
    created_at: string
    payment_status: string  // ✅ Agregar
    shipping_status: string
    shipped_at?: string | null
    delivered_at?: string | null
    tracking_number?: string | null
  }
}
```

---

### CAMBIO 9 — OrderTimeline: Mostrar pago según payment_status real

**Archivo:** `src/components/OrderTimeline.tsx`  
**Líneas:** 23-29

**Cambio:**
```typescript
// ANTES:
// 1. Pago confirmado (siempre completed) ❌
events.push({
  status: 'completed',
  label: 'Pago confirmado',
  icon: '✅',
  date: formatDate(order.created_at),
  color: 'text-emerald-500'
})

// DESPUÉS:
// 1. Pago (estado depende de payment_status) ✅
const isPaid = order.payment_status === 'paid'
events.push({
  status: isPaid ? 'completed' : 'current',
  label: isPaid ? 'Pago confirmado' : 'Esperando pago',
  icon: isPaid ? '✅' : '⏳',
  date: isPaid ? formatDate(order.created_at) : undefined,
  description: !isPaid ? 'Validando pago' : undefined,
  color: isPaid ? 'text-emerald-500' : 'text-yellow-600'
})
```

**Motivo:** Timeline debe reflejar payment_status real, no asumir pago confirmado

---

### CAMBIO 10 — /account/orders/[id]: Pasar payment_status a Timeline

**Archivo:** `src/app/account/orders/[id]/page.tsx`  
**Buscar:** `<OrderTimeline order={...} />`

**Cambio:**
```typescript
// Asegurar que se pasa payment_status a OrderTimeline
<OrderTimeline 
  order={{
    created_at: order.created_at,
    payment_status: order.payment_status,  // ✅ Incluir
    shipping_status: order.shipping_status,
    shipped_at: order.shipped_at,
    delivered_at: order.delivered_at,
    tracking_number: order.tracking_number
  }}
/>
```

---

## 🚫 QUÉ NO SE TOCARÁ

- ❌ DB schema
- ❌ RLS policies
- ❌ Stripe live keys
- ❌ Stripe webhook
- ❌ Checkout Stripe actual (solo agregamos payment_method)
- ❌ Admin verification backend
- ❌ Emails
- ❌ Layaways
- ❌ Inventario
- ❌ Admin envíos
- ❌ `/payment/bank-transfer/[transactionId]/page.tsx` UI (solo data fetching)
- ❌ Stripe checkout flow

---

## 📝 ARCHIVOS A MODIFICAR

1. ✅ `src/app/api/payments/bank-transfer/order/route.ts` (1 línea)
2. ✅ `src/app/api/payments/bank-transfer/config/route.ts` (+15 líneas)
3. ✅ `src/app/cart/page.tsx` (+2 líneas)
4. ✅ `src/app/payment/bank-transfer/[transactionId]/page.tsx` (~30 líneas modificadas)
5. ✅ `src/app/account/orders/[id]/page.tsx` (+80 líneas bloque transfer, query modificado)
6. ✅ `src/components/OrderTimeline.tsx` (~10 líneas modificadas)

**Total:** 6 archivos, ~140 líneas agregadas/modificadas

---

## 🧪 TESTING PLAN

### Test 1: Crear orden bank transfer
- Agregar producto al carrito
- Elegir "Transferencia bancaria MXN"
- Confirmar
- **Validar:** Orden creada con `payment_method = 'bank_transfer_mxn'`
- **Validar:** localStorage tiene `pendingBankTransferEmail`
- **Validar:** Redirect a `/payment/bank-transfer/[transactionId]`

### Test 2: Ver instrucciones de pago
- **Validar:** Página `/payment/bank-transfer/[transactionId]` carga correctamente
- **Validar:** Muestra banco, titular, CLABE, referencia, expiración
- **Validar:** Botones copiar CLABE/referencia funcionan
- **Validar:** Mensaje "Tu pieza queda reservada mientras validamos tu pago"

### Test 3: Panel cliente muestra transferencia
- Login como cliente guest (mismo email usado en orden)
- Ir a `/account/orders`
- Abrir orden
- **Validar:** Sección "Pago por transferencia pendiente" visible
- **Validar:** Muestra referencia de pago
- **Validar:** Muestra fecha de expiración
- **Validar:** Botón "Ver instrucciones de pago" funciona

### Test 4: Upload comprobante
- En página `/payment/bank-transfer/[transactionId]`
- Subir PDF/JPG válido
- **Validar:** Upload exitoso
- **Validar:** Mensaje "Comprobante recibido"

### Test 5: Panel cliente después de upload
- Refrescar `/account/orders/[id]`
- **Validar:** Bloque muestra "Comprobante recibido"
- **Validar:** Mensaje "Estamos validando tu pago"

### Test 6: Timeline payment_status = pending
- **Validar:** Timeline muestra "⏳ Esperando pago" (NO "Pago confirmado")
- **Validar:** Estado "current" (amarillo), no "completed" (verde)

### Test 7: Admin approve (backend existente)
- Admin aprueba comprobante
- **Validar:** `payment_status` cambia a `paid`
- **Validar:** Timeline ahora muestra "✅ Pago confirmado"

### Test 8: Seguridad
- **Validar:** No CLABE completa en logs
- **Validar:** payment_reference enmascarado en logs (`****XXXX`)
- **Validar:** No secretos en consola
- **Validar:** No errores críticos

### Test 9: Stripe no-regression
- Crear orden con tarjeta/Stripe
- **Validar:** Checkout Stripe funciona igual
- **Validar:** payment_method NO se setea para Stripe (o se setea como 'stripe')

### Test 10: Mobile
- Validar responsive en /cart, /payment/bank-transfer/[id], /account/orders/[id]

---

## 🚀 DEPLOY VERIFICATION

**Obligatorio:**
- Build local: PASS/FAIL
- Commit esperado: `<hash>`
- Commit production: `<hash>`
- Match: YES/NO
- Vercel status: READY/PROMOTED
- Production URL: https://bagclue.vercel.app
- Rutas validadas:
  - /cart
  - /payment/bank-transfer/[transactionId]
  - /account/orders/[id]
- Cambio visible en producción: YES/NO
- Consola sin errores críticos: YES/NO

---

## 📊 ESTIMACIÓN

**Complejidad:** Media  
**Tiempo estimado:** 1.5-2h (implementación + testing)  
**Riesgo:** Bajo (cambios acotados, no toca DB/RLS/Stripe core)

---

## ⚠️ CONSIDERACIONES

**localStorage para guest checkout:**
- Funciona solo si usuario NO cierra browser antes de acceder
- Expira en 24h (mismo plazo que orden)
- Cleanup automático al expirar
- Usuario puede volver a crear nueva orden si pierde acceso

**Alternativa futura (no MVP.2B):**
- Generar token temporal de acceso para guest
- Enviar link por email con token
- Más robusto pero requiere emails (fuera de scope)

---

**FIN DEL PLAN**  
**Esperando aprobación de Jhonatan para implementar**
