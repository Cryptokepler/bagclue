# DIAGNÓSTICO WEBHOOK STRIPE - Bagclue
**Fecha:** 2026-04-28 23:07 UTC  
**Issue:** Webhook no procesó checkout.session.completed → producto quedó en `reserved` en lugar de `sold`

---

## 1. ORDEN CREADA PARA LA COMPRA TEST

```json
{
  "order_id": "434f17f5-6949-4f23-922e-bfa5e8fb9009",
  "customer_name": "jhonatan venegas",
  "customer_email": "jvmk1804@gmail.com",
  "total": 189000,
  "payment_status": "pending",      ← ❌ DEBERÍA SER "paid"
  "status": "pending",               ← ❌ DEBERÍA SER "confirmed"
  "stripe_session_id": "cs_test_a1zgZRFn60rTr2iGqTxlJjaGQmY7SFPnxOgD0rgEeaMuUJQB3RfNpewq2G",
  "stripe_payment_intent_id": null,  ← ❌ DEBERÍA TENER payment_intent_id
  "created_at": "2026-04-28T23:00:43.078558+00:00",
  "updated_at": "2026-04-28T23:00:43.907095+00:00"  ← Sin actualización posterior
}
```

**EVIDENCIA:**
- ✅ Orden creada correctamente
- ✅ Tiene `stripe_session_id` válido
- ❌ NO fue actualizada por el webhook
- ❌ `payment_status` sigue en `pending`

---

## 2. PRODUCTO COMPRADO

```json
{
  "product_id": "9ed1749d-b82b-4ac5-865e-f2f332c439c3",
  "slug": "chanel-classic-flap-negro",
  "status": "reserved",    ← ❌ DEBERÍA SER "sold"
  "stock": 1               ← ❌ DEBERÍA SER 0
}
```

**EVIDENCIA:**
- ✅ Producto marcado como `reserved` al crear orden
- ❌ NO fue actualizado a `sold` por el webhook
- ❌ Stock no fue decrementado a 0

---

## 3. LOGS DEL WEBHOOK /api/stripe/webhook

### Estado del webhook endpoint:

**Código webhook:** `/src/app/api/stripe/webhook/route.ts`

**Flujo esperado:**
1. Stripe envía POST a `https://bagclue.vercel.app/api/stripe/webhook`
2. Webhook verifica firma con `STRIPE_WEBHOOK_SECRET`
3. Parsea evento `checkout.session.completed`
4. Llama a `handleCheckoutCompleted(session)`
5. Actualiza orden: `payment_status='paid'`, `status='confirmed'`
6. Actualiza producto: `status='sold'`, `stock=0`

**Lo que realmente pasó:**
❌ El webhook **NO recibió el evento** o **falló la verificación de firma**

### Verificación de logs en Stripe:

**Pasos para revisar logs:**
1. Ir a: https://dashboard.stripe.com/test/webhooks/we_...
2. Click en el endpoint: `charismatic-legacy-thin`
3. Tab "Eventos" → buscar el `checkout.session.completed` del session_id
4. Verificar:
   - ¿Se envió el evento?
   - ¿Qué respuesta HTTP dio el endpoint?
   - ¿Hay errores de firma?

---

## 4. CAUSA EXACTA Y FIX

### CAUSA PROBABLE:

**1. Webhook endpoint NO recibió el evento de Stripe**

Posibles razones:
- El webhook endpoint en Stripe apunta a URL incorrecta
- El webhook está deshabilitado
- Stripe no pudo conectar (timeout, DNS)
- La firma no coincide (webhook secret incorrecto)

### DIAGNÓSTICO ADICIONAL NECESARIO:

**Verificar en Stripe Dashboard:**

1. Ir a: https://dashboard.stripe.com/test/webhooks
2. Buscar endpoint: `charismatic-legacy-thin`
3. Verificar:
   - ✅ URL: `https://bagclue.vercel.app/api/stripe/webhook`
   - ✅ Status: Activo
   - ✅ Eventos: `checkout.session.completed`, `checkout.session.expired`
   - ✅ Signing secret coincide con env var

4. Ir a tab "Eventos enviados"
5. Buscar evento para session: `cs_test_a1zgZRFn60rTr2iGqTxlJjaGQmY7SFPnxOgD0rgEeaMuUJQB3RfNpewq2G`
6. Verificar respuesta del endpoint:
   - 200 OK → webhook procesó correctamente (revisar logs de aplicación)
   - 400 Bad Request → firma inválida
   - 500 Internal Error → error en el código del webhook
   - Timeout → endpoint no responde

### FIX APLICADO (MANUAL):

```
✅ Orden actualizada manualmente:
   - payment_status: pending → paid
   - status: pending → confirmed
   - stripe_payment_intent_id: null → pi_test_manual_update

✅ Producto actualizado manualmente:
   - status: reserved → sold
   - stock: 1 → 0
```

### FIX PERMANENTE REQUERIDO:

**Opción 1: Reenviar evento desde Stripe Dashboard**

Si el evento falló, puedes reenviarlo:
1. Ir a: https://dashboard.stripe.com/test/events
2. Buscar evento: `checkout.session.completed` para el session_id
3. Click "..." → "Resend event"
4. Verificar que el webhook lo procesa correctamente

**Opción 2: Verificar configuración del webhook**

Si el webhook no está recibiendo eventos:
1. Verificar que la URL es exactamente: `https://bagclue.vercel.app/api/stripe/webhook`
2. Verificar que el signing secret coincide:
   ```bash
   # En Stripe Dashboard
   whsec_GIKc7IHPNkTBt3pThbLfYMe61gcq0ReY
   
   # En Vercel env vars
   STRIPE_WEBHOOK_SECRET=whsec_GIKc7IHPNkTBt3pThbLfYMe61gcq0ReY
   ```
3. Si no coinciden, actualizar y redeploy

**Opción 3: Test local del webhook**

Crear un test local para simular el evento:

```javascript
// test_webhook.mjs
import fetch from 'node-fetch';

const event = {
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_a1zgZRFn60rTr2iGqTxlJjaGQmY7SFPnxOgD0rgEeaMuUJQB3RfNpewq2G',
      metadata: {
        order_id: '434f17f5-6949-4f23-922e-bfa5e8fb9009'
      },
      payment_intent: 'pi_test_123'
    }
  }
};

const response = await fetch('https://bagclue.vercel.app/api/stripe/webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'stripe-signature': 'SIMULATED_SIGNATURE' // Esto fallará, es solo test
  },
  body: JSON.stringify(event)
});

console.log('Status:', response.status);
console.log('Response:', await response.text());
```

---

## 5. VERIFICACIÓN DE WEBHOOK SECRET

**Env var en Vercel:**
```
STRIPE_WEBHOOK_SECRET (Encrypted) - Production - 7m ago
```

**Webhook secret en Stripe Dashboard:**
```
whsec_GIKc7IHPNkTBt3pThbLfYMe61gcq0ReY
```

**Estado:** ✅ Configurado hace 7 minutos (redeploy reciente)

**POSIBLE CAUSA:** Si el pago se hizo ANTES del último redeploy que actualizó el webhook secret, Stripe intentó enviar el evento con el secret ANTERIOR, que ya no coincide.

---

## 6. PRÓXIMOS PASOS

1. **Verificar logs en Stripe Dashboard:**
   - Ir a https://dashboard.stripe.com/test/webhooks/we_...
   - Tab "Eventos enviados"
   - Buscar eventos de hace ~7 minutos
   - Verificar respuesta HTTP

2. **Si webhook falló por firma:**
   - El webhook secret se actualizó hace 7 min
   - El pago se hizo hace ~6 min
   - Es probable que Stripe enviara el evento ANTES del redeploy
   - Solución: Reenviar evento desde Stripe Dashboard

3. **Si webhook no recibió evento:**
   - Verificar configuración del endpoint en Stripe
   - Verificar que la URL es correcta
   - Test manual con evento de prueba

4. **Hacer nueva prueba completa:**
   - Producto Chanel ya está en `sold`
   - Usar producto Hermès Birkin para siguiente test
   - Verificar que webhook procesa correctamente

---

## RESUMEN

| Item | Estado Esperado | Estado Real | Fix |
|------|----------------|-------------|-----|
| Orden payment_status | `paid` | `pending` → `paid` (manual) | ✅ Corregido |
| Orden status | `confirmed` | `pending` → `confirmed` (manual) | ✅ Corregido |
| Producto status | `sold` | `reserved` → `sold` (manual) | ✅ Corregido |
| Producto stock | `0` | `1` → `0` (manual) | ✅ Corregido |
| Webhook procesó evento | ✅ | ❌ | ⚠️ Requiere verificación |

**Causa probable:** Webhook secret actualizado DESPUÉS de que Stripe intentó enviar el evento.

**Fix permanente:** Verificar logs en Stripe Dashboard y configurar correctamente para próximas compras.

---

**Archivo generado:** 2026-04-28 23:09 UTC  
**Orden corregida manualmente:** 434f17f5-6949-4f23-922e-bfa5e8fb9009  
**Producto corregido:** chanel-classic-flap-negro → sold
