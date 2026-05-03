# FASE 5C.3B.3 — UI BOTÓN "PAGAR CUOTA"

**Fecha:** 2026-05-02  
**Status:** ✅ **IMPLEMENTADO - PENDIENTE VALIDACIÓN**

---

## OBJETIVO

Agregar botón "Pagar próxima cuota" en `/account/layaways/[id]` para que el cliente pueda pagar la siguiente cuota pendiente usando el endpoint `POST /api/layaways/[id]/pay-installment`.

---

## SCOPE AUTORIZADO

1. ✅ Mostrar botón "Pagar próxima cuota" en el detalle del apartado
2. ✅ Botón aparece solo si:
   - `layaway.status = 'active'` o `'overdue'`
   - `amount_remaining > 0`
   - Existe una cuota `pending` o `overdue`
3. ✅ Usar usuario autenticado
4. ✅ Obtener `access_token` desde Supabase Auth
5. ✅ Llamar `POST /api/layaways/[id]/pay-installment` con `Authorization: Bearer <token>`
6. ✅ Si devuelve `checkout_url`, redirigir a Stripe Checkout
7. ✅ Mostrar loading state mientras crea sesión
8. ✅ Mostrar error amigable si falla
9. ✅ Mantener texto de seguridad/política del apartado
10. ✅ Mantener calendario de pagos

---

## ARCHIVOS MODIFICADOS

### 1. `src/app/account/layaways/[id]/page.tsx`

**Cambios realizados:**

#### A. Estados agregados:
```typescript
const [paymentLoading, setPaymentLoading] = useState(false)
const [paymentError, setPaymentError] = useState<string | null>(null)
```

#### B. Función `handlePayInstallment()`:
```typescript
const handlePayInstallment = async () => {
  if (!layaway || !nextPayment) return
  
  try {
    setPaymentLoading(true)
    setPaymentError(null)
    
    // 1. Get access token from Supabase Auth
    const { data: { session }, error: sessionError } = 
      await supabaseCustomer.auth.getSession()
    
    if (sessionError || !session) {
      setPaymentError('Sesión expirada. Por favor, inicia sesión nuevamente.')
      setPaymentLoading(false)
      return
    }
    
    const accessToken = session.access_token
    
    // 2. Call pay-installment endpoint
    const response = await fetch(`/api/layaways/${layaway.id}/pay-installment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment_number: nextPayment.payment_number
      })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      setPaymentError(data.error || 'Error al crear la sesión de pago')
      setPaymentLoading(false)
      return
    }
    
    // 3. Redirect to Stripe Checkout
    if (data.url) {
      window.location.href = data.url
    } else {
      setPaymentError('No se recibió la URL de pago')
      setPaymentLoading(false)
    }
    
  } catch (error) {
    console.error('[PAY INSTALLMENT] Error:', error)
    setPaymentError('Error inesperado al procesar el pago')
    setPaymentLoading(false)
  }
}
```

#### C. UI del botón (dentro de la sección "Próximo pago"):
```typescript
{/* Botón pagar cuota - solo si layaway está activo y hay saldo pendiente */}
{(layaway.status === 'active' || layaway.status === 'overdue') && 
 amountRemaining > 0 && (
  <div className="mt-4">
    {paymentError && (
      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        {paymentError}
      </div>
    )}
    
    <button
      onClick={handlePayInstallment}
      disabled={paymentLoading}
      className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
        paymentLoading 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {paymentLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Creando sesión de pago...
        </span>
      ) : (
        `Pagar próxima cuota — $${nextPayment.amount_due.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`
      )}
    </button>
    
    <p className="text-xs text-blue-600 mt-2 text-center">
      Serás redirigido a Stripe para completar el pago de forma segura
    </p>
  </div>
)}

{/* Mensaje si no se puede pagar */}
{layaway.status !== 'active' && layaway.status !== 'overdue' && (
  <p className="text-xs text-gray-600 mt-2">
    El apartado debe estar activo para realizar pagos.
  </p>
)}
```

**Líneas modificadas:** +102, -3  
**Total cambios:** 105 líneas

---

## CÓMO FUNCIONA

### 1. Obtención del token
```typescript
const { data: { session }, error: sessionError } = 
  await supabaseCustomer.auth.getSession()

const accessToken = session.access_token
```

**Método:** `supabaseCustomer.auth.getSession()`  
**Token:** JWT access token de Supabase (stored in localStorage)  
**Duración:** Válido por 1 hora (auto-refresh handled by Supabase)

---

### 2. Llamada al endpoint
```typescript
const response = await fetch(`/api/layaways/${layaway.id}/pay-installment`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    payment_number: nextPayment.payment_number
  })
})
```

**URL:** `/api/layaways/[id]/pay-installment`  
**Method:** POST  
**Headers:**
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "payment_number": 4
}
```

**Response (success):**
```json
{
  "session_id": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/..."
}
```

**Response (error):**
```json
{
  "error": "Payment already paid"
}
```

---

### 3. Redirección a Stripe Checkout
```typescript
if (data.url) {
  window.location.href = data.url
}
```

**Stripe Checkout URL:** Generado por el endpoint backend  
**Metadata:** Incluye `layaway_id`, `layaway_payment_id`, `payment_number`, etc.  
**Return URL:** Configurado en el endpoint (success/cancel)

---

## BUILD RESULT

```
✓ Compiled successfully in 4.8s
  Running TypeScript ...
  Collecting page data using 3 workers ...
  Generating static pages using 3 workers (0/33) ...
✓ Generating static pages using 3 workers (33/33) in 313.5ms
  Finalizing page optimization ...

Route (app)
├ ƒ /account/layaways/[id]
├ ƒ /api/layaways/[id]/pay-installment
└ ƒ /api/stripe/webhook
```

**✅ BUILD: PASS**

---

## COMMIT

```
commit d0565cf
Author: KeplerAgents <info@kepleragents.com>
Date:   Fri May 2 13:23:00 2026 +0000

    feat: add pay installment button in layaway detail
    
 src/app/account/layaways/[id]/page.tsx | 105 +++++++++++++++++++++---
 1 file changed, 102 insertions(+), 3 deletions(-)
```

**Branch:** main  
**Pushed to:** origin/main  
**Vercel:** Auto-deploy triggered

---

## DEPLOY

**Production URL:** https://bagclue.vercel.app

**Vercel deploy log:**
```
✓ Build Completed in /vercel/output [16s]
  Deploying outputs...
Production: https://bagclue.vercel.app [29s]
✅ Deployment complete
```

**Deploy time:** 29 seconds  
**Status:** ✅ SUCCESS

---

## COMPORTAMIENTO ESPERADO

### Antes del pago:
1. ✅ Usuario logueado accede a `/account/layaways/[id]`
2. ✅ Detalle muestra progreso 3/8
3. ✅ Próxima cuota: pago #4 ($21,000 MXN)
4. ✅ Botón visible: "Pagar próxima cuota — $21,000.00 MXN"
5. ✅ Botón solo aparece si:
   - status = 'active' o 'overdue'
   - amount_remaining > 0
   - existe nextPayment (pending/overdue)

### Al hacer click:
1. ✅ Botón cambia a loading state: "Creando sesión de pago..." + spinner
2. ✅ Obtiene access token de Supabase
3. ✅ Llama endpoint `/api/layaways/[id]/pay-installment`
4. ✅ Recibe `checkout_url`
5. ✅ Redirige a Stripe Checkout (nueva ventana/tab)

### En Stripe Checkout:
1. ✅ Muestra monto: $21,000 MXN
2. ✅ Descripción: "Pago apartado - Cuota #4"
3. ✅ Tarjeta test: 4242 4242 4242 4242
4. ✅ Completa pago

### Después del pago (webhook):
1. ✅ Stripe envía evento `checkout.session.completed`
2. ✅ Webhook procesa evento
3. ✅ Actualiza `layaway_payments` (payment #4 → paid)
4. ✅ Actualiza `layaways` (amount_paid, payments_completed, etc.)
5. ✅ Redirige a `/account/layaways/[id]?payment_success=true`

### Al refrescar UI:
1. ✅ Progreso: 4/8
2. ✅ amount_paid: $105,000
3. ✅ amount_remaining: $84,000
4. ✅ Payment #4: paid ✓
5. ✅ Payment #5: próximo pago

---

## VALIDACIONES PENDIENTES (REQUIEREN TEST MANUAL)

| # | Criterio | Esperado | Status |
|---|----------|----------|--------|
| 1 | Build PASS | ✅ | ✅ PASS |
| 2 | Deploy manual production | ✅ | ✅ PASS |
| 3 | Botón aparece en apartado activo | Visible | ⏳ PENDIENTE |
| 4 | Botón NO aparece si no hay cuota pendiente | Hidden | ⏳ PENDIENTE |
| 5 | Botón NO aparece si layaway completed/cancelled | Hidden | ⏳ PENDIENTE |
| 6 | Click crea checkout_url | Redirect | ⏳ PENDIENTE |
| 7 | Pago Stripe test cuota #4 funciona | Success | ⏳ PENDIENTE |
| 8 | Webhook actualiza payment #4 | paid | ⏳ PENDIENTE |
| 9 | UI refleja 4/8 después de pago | 4/8 | ⏳ PENDIENTE |
| 10 | No se crea order | 0 orders | ⏳ PENDIENTE |
| 11 | Product/stock no cambia | Sin cambios | ⏳ PENDIENTE |
| 12 | /account/orders sigue funcionando | OK | ⏳ PENDIENTE |
| 13 | Checkout contado sigue funcionando | OK | ⏳ PENDIENTE |
| 14 | No hay errores en consola | Clean | ⏳ PENDIENTE |

---

## DB ANTES DEL PAGO (ESTADO ACTUAL)

### layaway_payment #4 (ANTES):
```sql
SELECT 
  id, payment_number, amount_due, amount_paid, status, paid_at
FROM layaway_payments
WHERE layaway_id = 'aaaaaaaa-bbbb-cccc-dddd-000000000001'
  AND payment_number = 4;
```

**Esperado:**
```
payment_number: 4
amount_due: 21000.00
amount_paid: null
status: pending
paid_at: null
stripe_session_id: null
stripe_payment_intent: null
```

### layaway (ANTES):
```sql
SELECT 
  amount_paid, amount_remaining, payments_completed, payments_remaining, status
FROM layaways
WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-000000000001';
```

**Esperado:**
```
amount_paid: 84000.00
amount_remaining: 105000.00
payments_completed: 3
payments_remaining: 5
status: active
```

---

## DB DESPUÉS DEL PAGO (ESPERADO)

### layaway_payment #4 (DESPUÉS):
```
payment_number: 4
amount_due: 21000.00
amount_paid: 21000.00
status: paid
paid_at: <timestamp>
stripe_session_id: cs_test_...
stripe_payment_intent: pi_...
```

### layaway (DESPUÉS):
```
amount_paid: 105000.00  (84000 + 21000)
amount_remaining: 84000.00  (189000 - 105000)
payments_completed: 4  (3 + 1)
payments_remaining: 4  (8 - 4)
status: active  (NO completed todavía)
next_payment_due_date: <fecha payment #5>
next_payment_amount: 21000.00
```

---

## CONFIRMACIONES DE NO MODIFICACIÓN

✅ **NO se tocó:**
- ❌ `src/app/api/stripe/webhook/route.ts` — Sin cambios
- ❌ `src/app/api/checkout/create-session/route.ts` — Sin cambios
- ❌ `admin/*` — Sin cambios
- ❌ `migrations/*` — Sin cambios
- ❌ DB schema — Sin cambios
- ❌ RLS policies — Sin cambios
- ❌ `orders/order_items` — Sin cambios
- ❌ `products/stock` — Sin cambios
- ❌ pay-full endpoint — No implementado
- ❌ cron jobs — Sin cambios
- ❌ refunds — No implementado
- ❌ notificaciones — Sin cambios

---

## PRÓXIMOS PASOS (BLOQUEADOS HASTA APROBACIÓN)

1. Jhonatan debe validar manualmente:
   - Botón aparece correctamente
   - Click redirige a Stripe
   - Pago test funciona
   - Webhook actualiza DB
   - UI refleja cambios

2. Si PASS → cerrar Fase 5C.3B.3 ✅

3. **NO AVANZAR** a Fase 5C.3B.4 (pay-full) sin aprobación explícita

---

**Status:** ⏸️ **ESPERANDO VALIDACIÓN MANUAL DE JHONATAN**
