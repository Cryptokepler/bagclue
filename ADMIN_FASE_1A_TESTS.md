# ADMIN FASE 1A — TESTS VALIDACIONES BACKEND

**Fecha:** 2026-05-04  
**Commit:** c57c9f4  
**Deploy URL:** https://bagclue.vercel.app  
**Endpoint:** PUT /api/orders/[id]/shipping

---

## TESTS REQUERIDOS

### TEST 1: Order paid + address + provider + tracking → shipped PASS
**Objetivo:** Validar que orden pagada con dirección puede marcarse como shipped si tiene provider y tracking

**Setup:**
- Orden con `payment_status = 'paid'`
- `shipping_address` lleno
- Request: `{ shipping_status: 'shipped', shipping_provider: 'dhl', tracking_number: '1234567890' }`

**Esperado:** ✅ PASS — Status cambia a shipped, shipped_at se marca, tracking_url se genera

**Resultado:** PENDIENTE

---

### TEST 2: Shipped → delivered PASS
**Objetivo:** Validar que orden shipped puede marcarse como delivered

**Setup:**
- Orden con `shipping_status = 'shipped'`
- Request: `{ shipping_status: 'delivered' }`

**Esperado:** ✅ PASS — Status cambia a delivered, delivered_at se marca

**Resultado:** PENDIENTE

---

### TEST 3: Shipped sin tracking → debe fallar
**Objetivo:** Validar que no se puede marcar como shipped sin tracking_number

**Setup:**
- Orden con `payment_status = 'paid'`, `shipping_address` lleno
- Request: `{ shipping_status: 'shipped', shipping_provider: 'dhl' }` (sin tracking_number)

**Esperado:** ❌ FAIL — Error 400: "Número de rastreo (tracking_number) es obligatorio para marcar como enviado"

**Resultado:** PENDIENTE

---

### TEST 4: Shipped sin provider → debe fallar
**Objetivo:** Validar que no se puede marcar como shipped sin shipping_provider

**Setup:**
- Orden con `payment_status = 'paid'`, `shipping_address` lleno
- Request: `{ shipping_status: 'shipped', tracking_number: '1234567890' }` (sin provider)

**Esperado:** ❌ FAIL — Error 400: "Paquetería (shipping_provider) es obligatoria para marcar como enviado"

**Resultado:** PENDIENTE

---

### TEST 5: Shipped sin shipping_address → debe fallar
**Objetivo:** Validar que no se puede marcar como shipped sin dirección

**Setup:**
- Orden con `payment_status = 'paid'`, `shipping_address = NULL`
- Request: `{ shipping_status: 'shipped', shipping_provider: 'dhl', tracking_number: '1234567890' }`

**Esperado:** ❌ FAIL — Error 400: "No se puede marcar como enviado sin dirección de envío confirmada"

**Resultado:** PENDIENTE

---

### TEST 6: Delivered si no está shipped → debe fallar
**Objetivo:** Validar que no se puede marcar como delivered si no estaba shipped antes

**Setup:**
- Orden con `shipping_status = 'pending'` o `'preparing'`
- Request: `{ shipping_status: 'delivered' }`

**Esperado:** ❌ FAIL — Error 400: "No se puede marcar como entregado sin haber sido enviado primero"

**Resultado:** PENDIENTE

---

### TEST 7: Unpaid order → no permite shipped
**Objetivo:** Validar que orden sin pago no puede marcarse como shipped

**Setup:**
- Orden con `payment_status = 'pending'`
- Request: `{ shipping_status: 'shipped', shipping_provider: 'dhl', tracking_number: '1234567890' }`

**Esperado:** ❌ FAIL — Error 400: "No se puede marcar como enviado sin pago confirmado"

**Resultado:** PENDIENTE

---

### TEST 8: Unpaid order → no permite preparing
**Objetivo:** Validar que orden sin pago no puede marcarse como preparing

**Setup:**
- Orden con `payment_status = 'pending'`
- Request: `{ shipping_status: 'preparing' }`

**Esperado:** ❌ FAIL — Error 400: "No se puede marcar como preparando sin pago confirmado"

**Resultado:** PENDIENTE

---

### TEST 9: Preparing sin address → debe fallar
**Objetivo:** Validar que no se puede marcar como preparing sin dirección (preferencia Jhonatan)

**Setup:**
- Orden con `payment_status = 'paid'`, `shipping_address = NULL`
- Request: `{ shipping_status: 'preparing' }`

**Esperado:** ❌ FAIL — Error 400: "No se puede marcar como preparando sin dirección de envío confirmada"

**Resultado:** PENDIENTE

---

### TEST 10: Tracking URL auto-generada DHL/FedEx
**Objetivo:** Validar que tracking_url se genera correctamente si no se envía

**Setup:**
- Orden con `payment_status = 'paid'`, `shipping_address` lleno
- Request: `{ shipping_status: 'shipped', shipping_provider: 'dhl', tracking_number: '1234567890' }` (sin tracking_url)

**Esperado:** ✅ PASS — tracking_url = "https://www.dhl.com.mx/es/express/rastreo.html?AWB=1234567890"

**Resultado:** PENDIENTE

---

## VALIDACIÓN CUSTOMER VIEW

### Customer View 1: /account/orders
**Objetivo:** Verificar que panel de cliente sigue funcionando

**Test:** Cliente autenticado accede a lista de pedidos

**Esperado:** ✅ PASS — Lista se muestra correctamente

**Resultado:** PENDIENTE

---

### Customer View 2: /account/orders/[id]
**Objetivo:** Verificar que detalle de pedido sigue funcionando

**Test:** Cliente accede a detalle de pedido propio

**Esperado:** ✅ PASS — Detalle se muestra correctamente

**Resultado:** PENDIENTE

---

### Customer View 3: /track/[token]
**Objetivo:** Verificar que tracking público sigue funcionando

**Test:** Acceso a tracking público vía token

**Esperado:** ✅ PASS — Tracking se muestra correctamente

**Resultado:** PENDIENTE

---

## RESUMEN

**Tests ejecutados:** 0 / 13  
**Tests PASS:** 0  
**Tests FAIL (esperados):** 0  
**Tests FAIL (no esperados):** 0

---

**Estado:** EN PROGRESO
