# FASE 5C.3B.3 — UI BOTÓN "PAGAR CUOTA"

**Fecha cierre:** 2026-05-02  
**Status:** ✅ **CERRADA - PASS**

---

## OBJETIVO CUMPLIDO

Implementar botón "Pagar próxima cuota" en el detalle del apartado (`/account/layaways/[id]`) para permitir a los clientes pagar cuotas pendientes usando el endpoint `POST /api/layaways/[id]/pay-installment`.

---

## IMPLEMENTACIÓN

### Archivos modificados:
1. `src/app/account/layaways/[id]/page.tsx` (+102 líneas, commit `d0565cf`)
2. `src/app/account/layaways/[id]/page.tsx` (fix +2/-2 líneas, commit `0c6dfdb`)

**Total commits:** 2

### Funcionalidad implementada:

**Estados agregados:**
```typescript
const [paymentLoading, setPaymentLoading] = useState(false)
const [paymentError, setPaymentError] = useState<string | null>(null)
```

**Handler del botón:**
```typescript
const handlePayInstallment = async () => {
  // 1. Obtener token de Supabase Auth
  const { data: { session } } = await supabaseCustomer.auth.getSession()
  const accessToken = session.access_token
  
  // 2. Llamar endpoint
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
  
  // 3. Redirigir a Stripe Checkout
  if (data.checkout_url) {
    window.location.href = data.checkout_url
  }
}
```

**UI del botón:**
- Aparece solo si:
  - `layaway.status = 'active'` o `'overdue'`
  - `amount_remaining > 0`
  - Existe `nextPayment` (pending/overdue)
- Loading state con spinner
- Error handling amigable
- Mensaje de seguridad

---

## BUG ENCONTRADO Y CORREGIDO

**Problema inicial:** Endpoint devuelve `checkout_url` pero UI buscaba `data.url`.

**Error mostrado:** "No se recibió la URL de pago"

**Fix aplicado:**
```typescript
// ANTES (incorrecto):
if (data.url) {
  window.location.href = data.url
}

// DESPUÉS (correcto):
if (data.checkout_url) {
  window.location.href = data.checkout_url
}
```

**Commit fix:** `0c6dfdb` - fix: use checkout_url instead of url in pay installment handler

---

## VALIDACIÓN COMPLETA

### A. Validación visual en producción (Jhonatan)

| Criterio | Resultado |
|----------|-----------|
| Botón "Pagar próxima cuota" aparece | ✅ PASS |
| Redirección a Stripe funciona | ✅ PASS |
| Stripe cobró cuota #4 por $21,000 MXN | ✅ PASS |
| Webhook actualizó UI | ✅ PASS |
| Progreso: 3/8 → 4/8 | ✅ PASS |
| Pagado: $84,000 → $105,000 | ✅ PASS |
| Saldo: $105,000 → $84,000 | ✅ PASS |
| Pago #4 aparece como "Pagado" | ✅ PASS |
| Próximo pago corresponde a cuota #5 | ✅ PASS |
| No hay errores en consola | ✅ PASS |

**UI validation:** ✅ 10/10 PASS

---

### B. Validación Supabase (automatizada)

**1. layaway_payment #4:**
```
payment_number: 4
amount_due: 21000
amount_paid: 21000 ✅
status: paid ✅
paid_at: 2026-05-02T13:33:48.693+00:00 ✅
stripe_session_id: cs_test_a1EEoXPUN91L... ✅
stripe_payment_intent: pi_3TSdfy2KuAFNA49O06lblSiL ✅
```

**2. layaway:**
```
amount_paid: 105000 ✅ (84000 + 21000)
amount_remaining: 84000 ✅ (189000 - 105000)
payments_completed: 4 ✅
payments_remaining: 4 ✅
next_payment_amount: 21000 ✅
status: active ✅ (NO completed)
```

**3. orders:**
```
Orders creadas hoy: 0 ✅
```

**4. product (Chanel Classic Flap Negro):**
```
status: available ✅
stock: 1 ✅
price: 189000 ✅
```

**DB validation:** ✅ 4/4 PASS

---

### C. Confirmación de áreas NO tocadas

✅ **NO se modificó:**
- pay-full (no implementado)
- admin
- checkout de contado
- DB schema
- RLS policies
- migrations
- products/stock
- orders/order_items
- cron jobs
- webhook (`src/app/api/stripe/webhook/route.ts`)

**Scope compliance:** ✅ PASS

---

## BUILD & DEPLOY

**Build local:**
```
✓ Compiled successfully in 4.8s
✓ Generating static pages (33/33) in 313.5ms
```

**Commits:**
1. `d0565cf` - feat: add pay installment button in layaway detail
2. `0c6dfdb` - fix: use checkout_url instead of url in pay installment handler

**Deploys:**
1. https://bagclue.vercel.app (commit d0565cf) - con bug
2. https://bagclue.vercel.app (commit 0c6dfdb) - bug corregido ✅

**Deploy final:** ✅ SUCCESS

---

## FLUJO COMPLETO VALIDADO

### 1. Pre-pago (3/8 pagos completados)
- amount_paid: $84,000
- amount_remaining: $105,000
- payments_completed: 3
- payments_remaining: 5
- Próximo pago: cuota #4 ($21,000)

### 2. Usuario hace click en botón
- Obtiene token: `supabaseCustomer.auth.getSession()`
- Llama: `POST /api/layaways/[id]/pay-installment`
- Recibe: `{ checkout_url: "https://checkout.stripe.com/..." }`
- Redirige a Stripe Checkout

### 3. Pago en Stripe
- Tarjeta test: 4242 4242 4242 4242
- Monto: $21,000 MXN
- Descripción: Pago de cuota #4
- Pago exitoso ✅

### 4. Webhook procesa evento
- Event: `checkout.session.completed`
- Metadata: `type=layaway_installment`, `payment_number=4`
- Actualiza `layaway_payments` (payment #4 → paid)
- Recalcula `layaways` (amount_paid, payments_completed, etc.)
- NO crea orders
- NO toca stock

### 5. Post-pago (4/8 pagos completados)
- amount_paid: $105,000 ✅
- amount_remaining: $84,000 ✅
- payments_completed: 4 ✅
- payments_remaining: 4 ✅
- Próximo pago: cuota #5 ($21,000) ✅
- UI refleja cambios correctamente ✅

---

## TIEMPO INVERTIDO

- Implementación inicial: ~20 min
- Build + deploy: ~5 min
- Bug fix (checkout_url): ~5 min
- Redeploy: ~3 min
- Validación manual (Jhonatan): ~5 min
- Validación automática + documentación: ~10 min

**Total:** ~48 minutos

---

## LECCIONES APRENDIDAS

1. **Verificar nombres de campos en respuesta del endpoint**  
   El endpoint devuelve `checkout_url`, no `url`. Siempre verificar contrato API antes de implementar.

2. **Validación en dos etapas: visual + DB**  
   UI puede verse bien pero DB puede estar mal. Validar ambos.

3. **Loading states mejoran UX**  
   Spinner + mensaje claro ("Creando sesión de pago...") evita confusión.

4. **Error handling específico**  
   Mensajes de error claros ("Sesión expirada. Por favor, inicia sesión nuevamente.") mejor que genéricos.

5. **Supabase Auth session management**  
   `getSession()` obtiene token válido del localStorage. No necesita re-login cada vez.

---

## DOCUMENTACIÓN GENERADA

1. `FASE_5C3B3_IMPLEMENTACION_BOTON_PAGAR.md` (11KB)
2. `FASE_5C3B3_RESUMEN.md` (4KB)
3. `FASE_5C3B3_CIERRE_FINAL.md` (este documento)
4. `scripts/validate-fase-5c3b3.mjs` (validación automatizada)
5. Memory actualizado: `memory/2026-05-02.md`

---

## PRÓXIMOS PASOS (BLOQUEADOS)

**Fase 5C.3B.4:** (Pendiente definición de scope)

Posibles opciones:
- Pagar saldo completo (pay-full)
- Completar apartado cuando todas las cuotas estén pagadas
- Frontend para admin de apartados
- Notificaciones de pago

**⏸️ NO avanzar sin aprobación explícita de Jhonatan.**

---

## CONCLUSIÓN

✅ **FASE 5C.3B.3 — UI BOTÓN "PAGAR CUOTA": CERRADA**

El botón de pago de cuotas funciona correctamente end-to-end:
- UI muestra botón solo cuando corresponde
- Click redirige a Stripe Checkout
- Pago procesa correctamente
- Webhook actualiza DB
- UI refleja cambios en tiempo real
- NO afecta orders, stock ni otras áreas

Sistema listo para siguiente fase.

---

**Cierre validado por:** Kepler  
**Aprobado por:** Jhonatan Venegas  
**Fecha:** 2026-05-02 13:34 UTC
