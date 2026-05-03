# REENVIAR EVENTO Y VALIDAR DB

**Fecha:** 2026-05-02  
**Cambios aplicados:**
- ✅ STRIPE_WEBHOOK_SECRET actualizado con signing secret del endpoint snapshot (últimos 4: `GhbI`)
- ✅ Redeploy production completado
- ✅ URL: https://bagclue.vercel.app

---

## PASO 1: DESACTIVAR ENDPOINT DUPLICADO (OPCIONAL)

Para evitar confusiones futuras, desactivar el endpoint duplicado:

1. Ir a: https://dashboard.stripe.com/test/webhooks

2. Click en **"charismatic-legacy-thin"** (el de 24 eventos)

3. Click en **"..." (más opciones)** → **"Disable"** o **"Delete"**

4. Confirmar la acción

**Nota:** El endpoint oficial es **charismatic-legacy-snapshot** (236 eventos)

---

## PASO 2: REENVIAR EVENTO

1. Ir a: https://dashboard.stripe.com/test/events/evt_1TSchL2KuAFNA49O5IGomjJ9

2. Buscar botón **"Send test webhook"** o **"Resend"** o **"..."** → **"Resend event"**

3. Click para reenviar el evento

4. **VALIDAR RESPUESTA DEL WEBHOOK:**
   - Debe mostrar **HTTP 200 OK** ✅
   - Si muestra 400, 401, 500 → reportar error exacto

---

## PASO 3: VALIDAR DB EN SUPABASE

### A. Validar `layaway_payments` (cuota #3)

Ejecutar en Supabase SQL Editor:

```sql
SELECT 
  id,
  payment_number,
  amount,
  status,
  paid_at,
  stripe_session_id,
  stripe_payment_intent,
  amount_paid
FROM layaway_payments
WHERE layaway_id = 'aaaaaaaa-bbbb-cccc-dddd-000000000001'
  AND payment_number = 3;
```

**Valores esperados:**
- ✅ `status = 'paid'`
- ✅ `paid_at` ≠ null (timestamp del pago, ej: 2026-05-02 12:31:07)
- ✅ `stripe_payment_intent = 'pi_3TSchK2KuAFNA49O1SRx5uWa'`
- ✅ `amount_paid = 21000.00` (decimal, NO centavos)
- ✅ `stripe_session_id` debe tener valor

---

### B. Validar `layaways` (apartado completo)

```sql
SELECT 
  id,
  status,
  total_amount,
  amount_paid,
  amount_remaining,
  payments_completed,
  payments_remaining,
  next_payment_due_date,
  next_payment_amount
FROM layaways
WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-000000000001';
```

**Valores esperados:**
- ✅ `status = 'active'` (NO 'completed')
- ✅ `total_amount = 189000.00` (sin cambios)
- ✅ `amount_paid = 84000.00` (42000 inicial + 21000 cuota 1 + 21000 cuota 3)
- ✅ `amount_remaining = 105000.00` (189000 - 84000)
- ✅ `payments_completed = 3` (depósito + pago 1 + pago 3)
- ✅ `payments_remaining = 5` (8 total - 3 completados)
- ✅ `next_payment_due_date` = fecha del pago #4
- ✅ `next_payment_amount = 21000.00`

---

### C. Validar que NO se creó orden

```sql
SELECT COUNT(*) as orders_count
FROM orders
WHERE metadata->>'layaway_id' = 'aaaaaaaa-bbbb-cccc-dddd-000000000001';
```

**Valor esperado:**
- ✅ `orders_count = 0` (NO debe crear orden todavía)

---

### D. Validar producto NO afectado

```sql
SELECT 
  id,
  title,
  status,
  stock,
  is_published
FROM products
WHERE id = '9ed1749d-b82b-4ac5-865e-f2f332c439c3';
```

**Valores esperados:**
- ✅ `status` sin cambios (debe seguir igual)
- ✅ `stock = 1` (NO debe disminuir)
- ✅ `is_published = true` (NO debe cambiar)

---

## PASO 4: VALIDAR UI (OPCIONAL)

1. Ir a: https://bagclue.vercel.app/account/login

2. Loguearse como: jhonatanvenegas@usdtcapital.es

3. Ir a: **Mi Cuenta → Mis Apartados**

4. Abrir el apartado de Chanel Classic Flap

**Validaciones visuales:**
- ✅ Muestra "3/8 pagos completados"
- ✅ Pago #3 aparece como "Pagado" con fecha 02 May 2026
- ✅ Pago #4 aparece como "Pendiente"
- ✅ Próximo pago: $21,000 MXN

---

## RESULTADOS ESPERADOS

### ✅ TODO CORRECTO:
- Webhook responde 200 OK
- DB actualizado correctamente
- UI refleja pago completado
- NO se creó orden
- Producto NO afectado

### ❌ SI ALGO FALLA:

**Webhook sigue con 400:**
- Verificar que el secret en Vercel sea del endpoint snapshot
- Verificar que el redeploy terminó correctamente
- Revisar logs de Vercel para ver error exacto

**Webhook devuelve 500:**
- El handler tiene un bug
- Revisar logs de Vercel:
  - Ir a: https://vercel.com/kepleragents/bagclue/logs
  - Buscar timestamp del reenvío
  - Buscar keywords: `[WEBHOOK`, `layaway_installment`, `ERROR`
  - Reportar error exacto a Kepler

**DB no se actualiza:**
- Webhook puede estar respondiendo 200 pero sin procesar
- Handler puede estar en modo DEBUG sin commits
- Revisar logs de Vercel para ver qué está pasando

---

## REPORTAR A KEPLER

Después de reenviar el evento, reportar:

1. **HTTP response code del webhook:** (200, 400, 500, etc.)

2. **Estado de la cuota #3 en DB:**
   - status: 
   - paid_at:
   - amount_paid:

3. **Estado del apartado en DB:**
   - amount_paid:
   - payments_completed:
   - status:

4. **Si hubo error:**
   - Logs de Vercel (screenshot o texto)
   - Error exacto del webhook

---

## NOTAS IMPORTANTES

❌ **NO HACER:**
- Otro pago nuevo
- Crear otra sesión de checkout
- Modificar código
- Tocar handlers
- Modificar DB manualmente
- Avanzar a Fase 5C.3B.3

✅ **SÍ HACER:**
- Reenviar el mismo evento (evt_1TSchL2KuAFNA49O5IGomjJ9)
- Validar webhook response
- Validar DB con queries SQL
- Reportar resultados a Kepler

---

**Status:** ⏸️ **ESPERANDO REENVÍO Y VALIDACIÓN**
