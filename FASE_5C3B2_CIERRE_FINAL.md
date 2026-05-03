# FASE 5C.3B.2 — WEBHOOK RECONCILIATION INSTALLMENT PAYMENT

**Fecha cierre:** 2026-05-02  
**Status:** ✅ **CERRADA - PASS**

---

## OBJETIVO CUMPLIDO

Implementar reconciliación del webhook para procesar pagos de cuotas de apartado cuando Stripe envía el evento `checkout.session.completed` con `metadata.type = 'layaway_installment'`.

**Scope:**
- ✅ Recibir evento de Stripe
- ✅ Validar metadata completo
- ✅ Actualizar `layaway_payments` (status, paid_at, stripe IDs, amount_paid)
- ✅ Recalcular campos del `layaway` (amount_paid, amount_remaining, payments_completed, next_payment, etc.)
- ✅ Mantener status 'active' (NO completar apartado)
- ✅ NO crear orders
- ✅ NO tocar stock
- ✅ Idempotencia

---

## PROBLEMA DIAGNOSTICADO Y RESUELTO

### Problema inicial:
- Checkout Session creado: ✅ PASS
- Pago Stripe completado: ✅ PASS
- Webhook delivery: ❌ FAIL (400 ERR)
- DB sin cambios: ❌ FAIL

### Diagnóstico:
**Causa raíz:** STRIPE_WEBHOOK_SECRET en Vercel no coincidía con signing secret del webhook endpoint en Stripe.

**Agravante:** Existían 2 webhook endpoints activos apuntando a la misma URL:
1. `charismatic-legacy-thin` (24 eventos)
2. `charismatic-legacy-snapshot` (236 eventos) ← **OFICIAL**

Cada endpoint tiene su propio signing secret, pero Vercel solo puede usar uno.

### Solución aplicada:
1. ✅ Identificado endpoint oficial: `charismatic-legacy-snapshot`
2. ✅ Obtenido signing secret correcto: `whsec_[REDACTED_GhbI]`
3. ✅ Actualizado `STRIPE_WEBHOOK_SECRET` en Vercel Production
4. ✅ Actualizado `contraseñas/stripe_bagclue_test.md`
5. ✅ Redeploy production exitoso
6. ✅ Reenviado evento desde Stripe Dashboard
7. ✅ Webhook respondió 200 OK
8. ✅ DB actualizado correctamente

---

## VALIDACIÓN COMPLETA

### A. Webhook delivery
**Evento:** `evt_1TSchL2KuAFNA49O5IGomjJ9`  
**HTTP response:** 200 OK  
**Response body:** `{ "received": true }`

### B. Database - layaway_payment #3
```
status: paid ✅
amount_paid: 21000.00 ✅
paid_at: 2026-05-02 13:15:40.094+00 ✅
stripe_session_id: cs_test_a1Zf702Kb07gL0OSJu0dLfB7skRWKgCoTLqQCP8UEJHY4l1lMo9Fvjrpfk ✅
stripe_payment_intent_id: pi_3TSchK2KuAFNA49O1SRx5uWa ✅
```

### C. Database - layaway
```
amount_paid: 84000.00 ✅ (42000 depósito + 21000 cuota 1 + 21000 cuota 3)
amount_remaining: 105000.00 ✅ (189000 - 84000)
payments_completed: 3 ✅
payments_remaining: 5 ✅
next_payment_due_date: 2026-05-14 05:59:59+00 ✅
next_payment_amount: 21000.00 ✅
status: active ✅ (NO completed)
```

### D. Orders
```sql
SELECT COUNT(*) FROM orders WHERE user_id = '9b37d6cc-0b45-4a39-8226-d3022606fcd8' AND created_at >= '2026-05-02';
Result: 0 ✅
```

**✅ PASS - No se crearon orders**

### E. Product (Chanel Classic Flap Negro)
```
id: 9ed1749d-b82b-4ac5-865e-f2f332c439c3
status: available ✅
stock: 1 ✅
price: 189000 ✅
is_published: true ✅
```

**✅ PASS - Producto sin cambios**

### F. UI Validation (por Jhonatan)
- ✅ Pago #3 aparece como "Pagado"
- ✅ Pago #4 aparece como "Próximo"
- ✅ Progreso: 3/8 pagos completados
- ✅ Sin errores críticos en consola

### G. Áreas restringidas NO tocadas
- ✅ UI (no se modificó)
- ✅ Admin (no se modificó)
- ✅ Checkout de contado (no se modificó)
- ✅ DB schema (no se modificó)
- ✅ RLS policies (no se modificó)
- ✅ Migrations (no se modificó)
- ✅ order_items (no se modificó)
- ✅ pay-full endpoint (no implementado todavía)
- ✅ Cron jobs (no se modificó)

---

## ARCHIVOS MODIFICADOS

### Producción (deployed):
Ninguno - solo cambio de env var en Vercel.

### Documentación creada:
1. `DIAGNOSE_WEBHOOK_5C3B2.md` - Diagnóstico completo del problema
2. `WEBHOOK_SECRET_FIX.md` - Plan de corrección del secret
3. `REENVIAR_EVENTO_VALIDAR_DB.md` - Guía de validación
4. `FASE_5C3B2_CIERRE_FINAL.md` - Este documento

### Scripts de validación:
1. `scripts/diagnose-webhook.mjs`
2. `scripts/get-webhook-secret.mjs`
3. `scripts/identify-snapshot-webhook.mjs`
4. `scripts/validate-final-5c3b2.mjs`
5. `scripts/check-orders-simple.mjs`
6. `scripts/check-orders-minimal.mjs`

### Contraseñas actualizadas:
1. `contraseñas/stripe_bagclue_test.md` - Signing secret actualizado

---

## COMMITS

Ninguno necesario - solo cambio de configuración en Vercel.

**Git status:** Clean (no hay cambios pendientes de código)

---

## LECCIONES APRENDIDAS

1. **Múltiples webhooks = problemas de firma**  
   Tener 2 endpoints activos con diferentes secrets causa 400 ERR. Usar solo 1 endpoint oficial.

2. **Vercel env vars encriptadas**  
   No se pueden leer directamente via CLI. Necesario confirmar valores manualmente en Dashboard.

3. **Stripe API no expone signing secrets**  
   Por seguridad, la API no devuelve el secret completo. Debe obtenerse del Dashboard.

4. **Diagnóstico antes de código**  
   400 ERR = problema de configuración, no de código. No implementar más código hasta confirmar causa raíz.

5. **Reenviar eventos para validar**  
   Después de corregir configuración, reenviar el mismo evento en vez de hacer otro pago. Ahorra tiempo y evita datos duplicados.

---

## TIEMPO INVERTIDO

- Diagnóstico webhook: ~20 min
- Corrección secret + redeploy: ~10 min
- Validación DB + UI: ~5 min
- Documentación: ~15 min

**Total:** ~50 minutos

---

## PRÓXIMOS PASOS (REQUIERE APROBACIÓN)

**Fase 5C.3B.3:** Implementar botón "Pagar" en UI de Mis Apartados (frontend)

**Bloqueado hasta aprobación explícita de Jhonatan.**

---

## CONCLUSIÓN

✅ **FASE 5C.3B.2 — WEBHOOK RECONCILIAR CUOTA: CERRADA**

El webhook ahora procesa correctamente los pagos de cuotas de apartado:
- Valida metadata
- Actualiza layaway_payments
- Recalcula totales del layaway
- Mantiene status 'active'
- NO crea orders
- NO toca stock
- Implementa idempotencia

Sistema listo para siguiente fase.

---

**Cierre validado por:** Kepler  
**Aprobado por:** Jhonatan Venegas  
**Fecha:** 2026-05-02 13:18 UTC
